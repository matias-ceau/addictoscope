import { resolve } from "node:path";

import { createWorker } from "tesseract.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { toPdf } from "../src/core/convert";
import { inputKind } from "../src/core/inputs";
import { OCR_ZOOM, ocrPage } from "../src/core/ocr";
import { paddleOcrPage, type PaddleModels } from "../src/core/paddle";
import { extractPageText, openPdf, pageSize, redactPdf, renderPagePng, renderPageRgb, SCAN_TEXT_THRESHOLD } from "../src/core/pdf";
import type { Detection, PageText } from "../src/core/types";
import { buildManifest, findLeaks } from "../src/core/verify";
import { assertSendable, CloudRefused } from "../src/cloud/guard";
import { detectCorpus } from "../src/pii/detect";
import { GROUND_TRUTH, loadPaddle, PADDLE_INSTALLED, readSample } from "./helpers";

type Tesseract = Awaited<ReturnType<typeof createWorker>>;
let tesseract: Tesseract;
let paddle: PaddleModels;

beforeAll(async () => {
  tesseract = await createWorker("fra", 1, {
    langPath: resolve(__dirname, "../node_modules/@tesseract.js-data/fra/4.0.0_best_int"),
    gzip: true,
    cacheMethod: "none",
  });
  if (PADDLE_INSTALLED) paddle = await loadPaddle();
});
afterAll(async () => tesseract?.terminate());

type Engine = "paddle" | "tesseract";

async function readPages(engine: Engine, bytes: Uint8Array, forceOcr: number[] = []): Promise<PageText[]> {
  const doc = openPdf(bytes);
  const pages: PageText[] = [];
  for (let i = 0; i < doc.countPages(); i++) {
    const text = extractPageText(doc, i);
    if (text.text.replace(/\s/g, "").length < SCAN_TEXT_THRESHOLD || forceOcr.includes(i)) {
      const { width, height } = pageSize(doc, i);
      pages.push(
        engine === "paddle"
          ? await paddleOcrPage(paddle, renderPageRgb(doc, i, OCR_ZOOM), i, width, height, OCR_ZOOM)
          : await ocrPage(tesseract, Buffer.from(renderPagePng(doc, i, OCR_ZOOM)), i, width, height),
      );
    } else pages.push(text);
  }
  return pages;
}

const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase();
/** As a whole word: "Rémi" is not readable because "premier" is. */
const readableIn = (text: string, id: string) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${fold(id).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "u").test(text);

/**
 * Planted identifiers the rules are known to leave: nothing in the text says
 * what they are (a former employer's name). The reviewer masks them by hand;
 * listed here so that the day a rule catches one, the list is corrected.
 */
const LEFT_TO_THE_REVIEWER: Record<string, string[]> = {
  "dossiers-longs/cocaine-cadre/historique.pdf": ["Médivia"],
};

// The app reads scans with PaddleOCR, and falls back to Tesseract when its
// models could not be installed: both paths must redact and verify.
const cases = Object.keys(GROUND_TRUTH).flatMap((name) => [
  ...(PADDLE_INSTALLED ? [{ name, engine: "paddle" as Engine }] : []),
  { name, engine: "tesseract" as Engine },
]);

describe.each(cases)("$name ($engine)", ({ name, engine }) => {
  let input: Uint8Array;
  let pages: PageText[];
  let output: Uint8Array;
  let outPages: PageText[];
  let detections: Detection[];

  beforeAll(async () => {
    // Word and text samples are laid out into a PDF first, as the app does.
    const raw = readSample(name);
    input = toPdf(raw, inputKind(name, raw)!);
    pages = await readPages(engine, input);
    detections = detectCorpus([{ id: name, pages }]);
    output = redactPdf(
      input,
      detections.map((d) => ({ page: d.page, rects: d.rects, label: d.label })),
    );
    const ocrPages = pages.filter((p) => p.source === "ocr").map((p) => p.page);
    outPages = await readPages(engine, output, ocrPages);
  });

  it("removes every planted identifier from the output", () => {
    const all = fold(outPages.map((p) => p.text).join("\n"));
    const left = GROUND_TRUTH[name].filter((id) => readableIn(all, id));
    expect(left).toEqual(LEFT_TO_THE_REVIEWER[name] ?? []);
  });

  it("finds every planted identifier before redaction", () => {
    const all = fold(pages.map((p) => p.text).join("\n"));
    // Sanity: the identifiers are readable in the input (by text layer or OCR).
    for (const id of GROUND_TRUTH[name]) expect(all, id).toContain(fold(id));
  });

  it("keeps the page geometry", () => {
    const a = openPdf(input);
    const b = openPdf(output);
    expect(b.countPages()).toBe(a.countPages());
    for (let i = 0; i < a.countPages(); i++) expect(pageSize(b, i)).toEqual(pageSize(a, i));
  });

  it("keeps clinical content and care dates in place", () => {
    const all = outPages.map((p) => p.text).join("\n");
    expect(all).toMatch(/\d{2}\/\d{2}\/20\d{2}/);
    expect(all.toLowerCase()).toMatch(/alcool|tabac|sevrage/);
  });

  it("leaves the lines without identifiers untouched", () => {
    // Text-layer pages only: scanned pages are read again from pixels.
    for (const page of pages.filter((p) => p.source === "pdf")) {
      const out = outPages[page.page].text;
      let start = 0;
      for (const line of page.text.split("\n")) {
        const end = start + line.length;
        const touched = detections.some((d) => d.page === page.page && d.start < end && d.end > start);
        if (!touched && line.trim()) expect(out, line).toContain(line);
        start = end + 1;
      }
    }
  });

  it("strips document metadata", () => {
    const doc = openPdf(output);
    expect(doc.getMetaData("info:Title") ?? "").toBe("");
    expect(doc.getMetaData("info:Author") ?? "").toBe("");
  });

  it("passes verification and unlocks the cloud guard only after review", async () => {
    const accepted = detectCorpus([{ id: name, pages }]);
    expect(findLeaks(outPages, accepted)).toEqual([]);
    const unreviewed = await buildManifest(output, outPages, accepted, false);
    expect(() => assertSendable(unreviewed, { kind: "openrouter-zdr", apiKey: "k", model: "m" })).toThrow(CloudRefused);
    const reviewed = await buildManifest(output, outPages, accepted, true);
    expect(reviewed.verified).toBe(true);
    expect(() => assertSendable(reviewed, { kind: "openrouter-zdr", apiKey: "k", model: "m" })).not.toThrow();
    expect(() => assertSendable(reviewed, { kind: "off" })).toThrow(CloudRefused);
  });
});

it("flags an identifier left in the output", () => {
  const page: PageText = { page: 0, width: 100, height: 100, text: "Mme MARCHAND va mieux.\n", words: [], source: "pdf" };
  const accepted = [{ text: "MARCHAND Sylvie", category: "PATIENT" }] as Parameters<typeof findLeaks>[1];
  expect(findLeaks([page], accepted)).toContainEqual({ page: 0, text: "MARCHAND", reason: "known-identifier" });
});

it("a frame drawn by hand masks its zone only: its words are not looked for elsewhere", () => {
  const text = "Suivi au CAARUD depuis 2023. Revue au CAARUD.";
  const word = (t: string, from: number, x: number) => ({ start: text.indexOf(t, from), end: text.indexOf(t, from) + t.length, rect: [x, 10, x + 40, 20] as [number, number, number, number] });
  const frame = { text: "CAARUD depuis", category: "PERSONNE", source: "manual", page: 0, rects: [[100, 5, 200, 25]] } as unknown as Parameters<typeof findLeaks>[1][number];
  // The framed words are gone from the zone and still written further on: no leak.
  const masked = { page: 0, text, words: [word("Suivi", 0, 10), word("Revue", 0, 300), word("CAARUD", 30, 350)] } as unknown as PageText;
  expect(findLeaks([masked], [frame])).toEqual([]);
  // A word still readable inside the zone is one.
  const readable = { page: 0, text, words: [word("CAARUD", 0, 120)] } as unknown as PageText;
  expect(findLeaks([readable], [frame])).toEqual([{ page: 0, text: "CAARUD", reason: "known-identifier" }]);
});

it("a frame drawn by hand over several lines leaves none of their text in the file", async () => {
  const bytes = await toPdf(new TextEncoder().encode(["Premier rang de mots ordinaires", "Deuxieme rang de mots ordinaires", "Troisieme rang de mots ordinaires", "Quatrieme rang de mots ordinaires", "Cinquieme rang de mots ordinaires", "Sixieme rang hors du cadre"].join("\n")), "text");
  const doc = openPdf(bytes);
  const page = extractPageText(doc, 0);
  const inside = page.words.filter((w) => /^(Premier|Deuxieme|Troisieme|Quatrieme|Cinquieme)$/.test(page.text.slice(w.start, w.end)));
  expect(inside).toHaveLength(5);
  const frame: [number, number, number, number] = [Math.min(...inside.map((w) => w.rect[0])) - 2, Math.min(...inside.map((w) => w.rect[1])) - 1, Math.max(...inside.map((w) => w.rect[2])) + 2, Math.max(...inside.map((w) => w.rect[3])) + 1];
  const out = extractPageText(openPdf(redactPdf(bytes, [{ page: 0, rects: [frame], label: "[MASQUE]", zone: true }])), 0);
  expect(out.text).not.toMatch(/Premier|Deuxieme|Troisieme|Quatrieme|Cinquieme/);
  expect(out.text).toContain("Sixieme");
  expect(out.text).toContain("ordinaires");
  const manual = { text: "x", category: "PERSONNE", source: "manual", page: 0, rects: [frame] } as unknown as Detection;
  expect(findLeaks([out], [manual])).toEqual([]);
});
