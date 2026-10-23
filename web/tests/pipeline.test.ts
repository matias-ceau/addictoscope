import { resolve } from "node:path";

import { createWorker } from "tesseract.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { OCR_ZOOM, ocrPage } from "../src/core/ocr";
import { paddleOcrPage, type PaddleModels } from "../src/core/paddle";
import { extractPageText, openPdf, pageSize, redactPdf, renderPagePng, renderPageRgb, SCAN_TEXT_THRESHOLD } from "../src/core/pdf";
import type { PageText } from "../src/core/types";
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

  beforeAll(async () => {
    input = readSample(name);
    pages = await readPages(engine, input);
    const detections = detectCorpus([{ id: name, pages }]);
    output = redactPdf(
      input,
      detections.map((d) => ({ page: d.page, rects: d.rects, label: d.label })),
    );
    const ocrPages = pages.filter((p) => p.source === "ocr").map((p) => p.page);
    outPages = await readPages(engine, output, ocrPages);
  });

  it("removes every planted identifier from the output", () => {
    const all = fold(outPages.map((p) => p.text).join("\n"));
    for (const id of GROUND_TRUTH[name]) expect(all, id).not.toContain(fold(id));
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
    expect(all).toMatch(/\d{2}\/\d{2}\/2024/);
    expect(all.toLowerCase()).toMatch(/alcool|tabac|sevrage/);
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
