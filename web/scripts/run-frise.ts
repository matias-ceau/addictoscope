/**
 * Run the app's cloud analysis (segmentation, then frise) on the fictional
 * dossiers, outside the browser, with a real model.
 *
 * Same path as the app: text layer -> rule detections (accepted as they
 * are, standing in for the human review) -> redaction -> re-read and
 * verification -> observations (by rules when the layout is recognised,
 * else by the model on page images of the *redacted* PDF) -> buildTimeline. A document that fails verification is not sent. As in the
 * app, the birth year is read from the detections, locally, and only turns
 * ages into years once the model has answered (antecedents it cannot place
 * are kept in timeline.undated).
 *
 * Run from web/ (key from the environment, never printed):
 *   OPENROUTER_API_KEY=... npx vite-node scripts/run-frise.ts
 *   ... scripts/run-frise.ts --dossier=opiaces-tso --model=anthropic/claude-sonnet-5.5
 *   ... scripts/run-frise.ts --root=dossiers-longs      the long dossiers
 *   ... scripts/run-frise.ts --segmentation=model       as before the rules: the model splits every document
 *
 * Without a key and without a paid call (scripts/file-transport.ts): each
 * request is written to a folder and answered from a file, e.g. by an agent
 * that reads this one request and nothing else. Run once to write the
 * requests, again once they are answered:
 *   npx vite-node scripts/run-frise.ts --root=dossiers-longs --answers=<folder> --out=longs/agents1
 *   ... --consolidate      a frise read in several lots is regrouped, as in the app (one more request per dossier)
 *
 * Output: data/processed/frise/[<--out>/]<dossier>.json, scored by
 *   uv run python scripts/score_frise.py
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

import { DEFAULT_MODEL } from "../src/cloud/client";
import type { CloudPolicy } from "../src/cloud/guard";
import { extractPageText, openPdf, redactPdf, renderPagePng, SCAN_TEXT_THRESHOLD } from "../src/core/pdf";
import { rectsForSpan } from "../src/core/geometry";
import type { Detection, PageText } from "../src/core/types";
import { buildManifest } from "../src/core/verify";
import { birthYearFromDetections } from "../src/notebook/age";
import { segmentRulesFirst, type SegmentedBy } from "../src/notebook/segment-rules";
import { fileTransport } from "./file-transport";
import { ARBITER, friseSettings, friseStep, READERS, reusedObservations } from "./frise-step";
import { detectCorpus, foldChars } from "../src/pii/detect";

const ROOT = resolve(__dirname, "../..");
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
/** --root=dossiers-longs: another folder of fictional dossiers under data/anonymized/. */
const ROOT_NAME = arg("root") ?? "dossiers";
const DOSSIERS = resolve(ROOT, "data/anonymized", ROOT_NAME);
/** Identifiers planted in the fictional documents (they must all be gone). */
const PLANTED: Record<string, string[]> = JSON.parse(readFileSync(resolve(ROOT, "data/anonymized/ground_truth.json"), "utf8"));
const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase();
const FRISE = resolve(ROOT, "data/processed/frise");
/** Same zoom as the app's analysis (src/app/analysis.ts). */
const IMAGE_ZOOM = 1.3;

/** --answers=<folder>: requests and answers go through files there, nothing is sent or paid. */
const transport = arg("answers") ? fileTransport(resolve(arg("answers")!)) : null;
const apiKey = transport ? "" : process.env.OPENROUTER_API_KEY;
if (!apiKey && !transport) throw new Error("OPENROUTER_API_KEY is not set");
/** --no-reviewer: a planted identifier the rules left stops its document, instead of being masked by hand. */
const REVIEWER = !process.argv.includes("--no-reviewer");
/** --segmentation=model: every document is split by the model, as in the runs made before the rules. */
const RULES_FIRST = arg("segmentation") !== "model";
const model = READERS.length ? `${READERS.join(" + ")}, arbitre ${ARBITER}` : (arg("model") ?? DEFAULT_MODEL);
const policy = { kind: "openrouter-zdr" as const, apiKey: apiKey ?? "", model: arg("model") ?? DEFAULT_MODEL };
/** --segment-model: a cheaper model for the segmentation only (the frise keeps --model). */
const segmentModel = arg("segment-model");
/** --text-only: numbered lines without the page images (text-only models; measures what the images add). */
const TEXT_ONLY = process.argv.includes("--text-only") || transport !== null;
const segmentPolicy: CloudPolicy = segmentModel ? { ...policy, model: segmentModel } : policy;
/** Repeated runs go to their own folder: --out=run2 -> data/processed/frise/run2/. */
const OUT = resolve(FRISE, arg("out") ?? ".");

const readPages = (doc: ReturnType<typeof openPdf>): PageText[] =>
  Array.from({ length: doc.countPages() }, (_, i) => extractPageText(doc, i));

/** fetch with retries on rate limits and server errors, recording usage. */
const usage = { calls: 0, promptTokens: 0, completionTokens: 0, cost: 0 };
/** Cost by model and step ("model frise"), for a consensus run. */
let costBy: Record<string, number> = {};
/** Raw model answers, kept to tell model errors from validation drops. */
let rawAnswers: { schema: string; content: unknown }[] = [];
const fetchImpl = (async (url: string, init: RequestInit) => {
  for (let attempt = 0; ; attempt++) {
    const res = await (transport?.fetchImpl ?? fetch)(url, init);
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
      continue;
    }
    if (res.ok) {
      const data = await res.clone().json();
      usage.calls++;
      usage.promptTokens += data?.usage?.prompt_tokens ?? 0;
      usage.completionTokens += data?.usage?.completion_tokens ?? 0;
      // With the user's own provider key (BYOK), OpenRouter reports 0 and the
      // provider bills upstream_inference_cost directly.
      usage.cost += data?.usage?.cost || data?.usage?.cost_details?.upstream_inference_cost || 0;
      const body = JSON.parse(String(init.body));
      const schema = body.response_format?.json_schema?.name;
      const key = `${body.model} ${schema}`;
      costBy[key] = (costBy[key] ?? 0) + (data?.usage?.cost || data?.usage?.cost_details?.upstream_inference_cost || 0);
      let content: unknown = data?.choices?.[0]?.message?.content;
      try {
        content = JSON.parse(String(content).replace(/^```(?:json)?\s*|\s*```$/g, ""));
      } catch {
        /* kept as text */
      }
      rawAnswers.push({ schema, content });
    }
    return res;
  }
}) as unknown as typeof fetch;

async function runDossier(slug: string) {
  const dir = resolve(DOSSIERS, slug);
  const files = readdirSync(dir).filter((f) => f.endsWith(".pdf")).sort();
  const sources = files.map((f) => {
    const bytes = new Uint8Array(readFileSync(resolve(dir, f)));
    const pages = readPages(openPdf(bytes));
    if (pages.some((p) => p.text.replace(/\s/g, "").length < SCAN_TEXT_THRESHOLD)) throw new Error(`${f}: scan, out of scope`);
    return { id: basename(f, ".pdf"), bytes, pages };
  });

  // One corpus per dossier, as when the files are dropped together.
  const detections = detectCorpus(sources.map(({ id, pages }) => ({ id, pages })));
  const docs: Record<string, object> = {};
  const observations = [];
  const pagesByDoc: Record<string, PageText[]> = {};
  const manifests: Record<string, Awaited<ReturnType<typeof buildManifest>>> = {};
  const segmentedBy: Record<string, SegmentedBy> = {};

  const reused = reusedObservations(FRISE, slug, new Set(sources.map((s) => s.id)));
  for (const src of sources) {
    const places = detections.filter((d) => d.doc === src.id && !d.accepted && d.category === "VILLE").map((d) => d.text);
    const wholeWord = (id: string) => new RegExp(`(?<![\\p{L}\\p{N}])${fold(id).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "giu");
    const mask = async (accepted: Detection[]) => {
      const output = redactPdf(src.bytes, accepted.map((d) => ({ page: d.page, rects: d.rects, label: d.label })));
      const outDoc = openPdf(output);
      const outPages = readPages(outDoc);
      const manifest = await buildManifest(output, outPages, accepted, true, places);
      const readable = fold(outPages.map((p) => p.text).join("\n"));
      // As whole words: "Rémi" is not left because "premier" is readable.
      const left = (PLANTED[`${ROOT_NAME}/${slug}/${src.id}.pdf`] ?? []).filter((id) => wholeWord(id).test(readable));
      return { accepted, outDoc, outPages, manifest, readable, left };
    };
    const automatic = await mask(detections.filter((d) => d.doc === src.id && d.accepted));
    // --show-left: which ones, in context (fictional documents only, so they can be printed).
    if (process.argv.includes("--show-left")) {
      for (const id of automatic.left) {
        const contexts = [...automatic.readable.matchAll(wholeWord(id))].map((m) => automatic.readable.slice(Math.max(0, m.index - 45), m.index + id.length + 25).replace(/\s+/g, " "));
        console.log(`  left: ${id} (${contexts.length})\n${contexts.slice(0, 6).map((c) => `      … ${c} …`).join("\n")}`);
      }
      if (automatic.manifest.leaks.length) console.log(`  leaks: ${JSON.stringify(automatic.manifest.leaks)}`);
    }
    // What the rules left, the reviewer masks by hand in the app (a rectangle
    // drawn on the page): the same detection here, on every occurrence.
    const byHand: Detection[] = REVIEWER
      ? automatic.left.flatMap((id) =>
          src.pages.flatMap((page) =>
            [...foldChars(page.text).matchAll(wholeWord(id))].map((m, i) => ({
              id: `m-${page.page}-${m.index}-${i}`,
              doc: src.id,
              page: page.page,
              start: m.index,
              end: m.index + m[0].length,
              text: page.text.slice(m.index, m.index + m[0].length),
              category: "PERSONNE" as const,
              source: "manual" as const,
              entity: `MANUEL:${id}`,
              label: "[MASQUE]",
              rects: rectsForSpan(page, m.index, m.index + m[0].length),
              accepted: true,
            })),
          ),
        )
      : [];
    const { accepted, outDoc, outPages, manifest, left } = byHand.length ? await mask([...automatic.accepted, ...byHand]) : automatic;
    const planted = left.length;
    docs[src.id] = { pages: outPages.length, redactions: manifest.redactions, verified: manifest.verified, leaks: manifest.leaks.length, leftByRules: automatic.left.length, maskedByHand: byHand.length, plantedLeft: planted };
    console.log(`${slug}/${src.id}: ${outPages.length} pages, ${accepted.length} masked (${byHand.length} by hand: ${automatic.left.length} identifier(s) the rules left), ${manifest.leaks.length} leaks, ${planted} planted identifiers left`);
    if (!manifest.verified || planted > 0) continue; // the guard would refuse the first, a reviewer the second

    pagesByDoc[src.id] = outPages;
    manifests[src.id] = manifest;
    if (reused) {
      observations.push(...reused.filter((o) => o.doc === src.id));
      continue;
    }
    const images = () =>
      Object.fromEntries(TEXT_ONLY ? [] : outPages.map((p) => [p.page, `data:image/png;base64,${Buffer.from(renderPagePng(outDoc, p.page, IMAGE_ZOOM)).toString("base64")}`]));
    const { observations: obs, by } = await segmentRulesFirst({ doc: src.id, pages: outPages, images, manifest, policy: segmentPolicy, fetchImpl, rules: RULES_FIRST });
    console.log(`  ${obs.length} observations (${by === "rules" ? "rules, nothing sent" : "model"})`);
    observations.push(...obs);
    segmentedBy[src.id] = by;
  }

  const birthYear = birthYearFromDetections(detections);
  const { timeline, timelineRead, timelineUnchecked, consensus, readings } = await friseStep({ observations, pagesByDoc, manifests, policy, fetchImpl, birthYear }, policy);
  if (consensus) console.log(`  consensus: ${JSON.stringify(consensus)}`);
  if (timeline.consolidation) console.log(`  regroupement: ${JSON.stringify(timeline.consolidation)}`);
  const fromAge = timeline.events.filter((e) => e.fromAge).length;
  console.log(
    `  frise: ${timeline.tracks.length} tracks, ${timeline.events.length} events (${fromAge} dated from an age), ` +
      `${timeline.undated.length} undated; birth year ${birthYear === null ? "unknown" : "known"}`,
  );
  return { dossier: slug, model, ...(segmentModel ? { segmentModel } : {}), ...(TEXT_ONLY ? { textOnly: true } : {}), ...(transport ? { transport: "files" } : {}), ...(RULES_FIRST && !reused ? { segmentation: "rules-first", segmentedBy } : {}), ...friseSettings(), ranAt: new Date().toISOString(), review: REVIEWER ? "automatic detections accepted as they are; the planted identifiers they left are masked by hand" : "automatic detections accepted as they are", docs, observations, timeline, ...(timelineRead ? { timelineRead } : {}), ...(timelineUnchecked ? { timelineUnchecked } : {}), ...(consensus ? { consensus, readings } : {}) };
}

mkdirSync(OUT, { recursive: true });
const only = arg("dossier");
const slugs = readdirSync(DOSSIERS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && (!only || d.name === only))
  .map((d) => d.name)
  .sort();
for (const slug of slugs) {
  // --resume: keep a dossier that already has a frise in this folder.
  if (process.argv.includes("--resume") && existsSync(resolve(OUT, `${slug}.json`)) && "timeline" in JSON.parse(readFileSync(resolve(OUT, `${slug}.json`), "utf8"))) continue;
  const before = { ...usage };
  const waiting = transport?.pending.length ?? 0;
  const chars = { ...(transport?.chars ?? { prompt: 0, answer: 0 }) };
  const charsBy = structuredClone(transport?.charsBy ?? {});
  rawAnswers = [];
  costBy = {};
  const t0 = Date.now();
  let result;
  try {
    result = await runDossier(slug);
  } catch (err) {
    // One failing dossier (a model that breaks the JSON schema, a provider
    // error) is recorded and the comparison goes on with the next one.
    console.log(`${slug}: FAILED ${String((err as Error).message ?? err).slice(0, 200)}`);
    result = { dossier: slug, model, ranAt: new Date().toISOString(), error: String((err as Error).message ?? err) };
  }
  const elapsedMs = Date.now() - t0;
  const spent = {
    calls: usage.calls - before.calls,
    promptTokens: usage.promptTokens - before.promptTokens,
    completionTokens: usage.completionTokens - before.completionTokens,
    cost: Number((usage.cost - before.cost).toFixed(4)),
  };
  if (transport && transport.pending.length > waiting) {
    // Requests still waiting: their empty answers must not pass for a frise.
    console.log(`  ${slug}: ${transport.pending.length - waiting} request(s) waiting for an answer, nothing written`);
    continue;
  }
  // Through files nothing is billed: the characters say what an API would have read and written.
  const read = transport
    ? {
        promptChars: transport.chars.prompt - chars.prompt,
        answerChars: transport.chars.answer - chars.answer,
        charsBy: Object.fromEntries(
          Object.entries(transport.charsBy)
            .map(([schema, c]) => [schema, { promptChars: c.prompt - (charsBy[schema]?.prompt ?? 0), answerChars: c.answer - (charsBy[schema]?.answer ?? 0) }] as const)
            .filter(([, c]) => c.promptChars > 0),
        ),
      }
    : {};
  writeFileSync(resolve(OUT, `${slug}.json`), JSON.stringify({ ...result, elapsedMs, usage: { ...spent, ...read, by: costBy }, rawAnswers }, null, 2) + "\n");
}
if (transport?.pending.length) console.log(`${transport.pending.length} request(s) to answer in ${resolve(arg("answers")!)}: ${transport.pending.join(" ")}`);
console.log(`total: ${usage.calls} calls, ${usage.promptTokens} + ${usage.completionTokens} tokens, $${usage.cost.toFixed(3)}`);
