/**
 * Run the app's cloud analysis (segmentation, then frise) on the fictional
 * dossiers, outside the browser, with a real model.
 *
 * Same path as the app: text layer -> rule detections (accepted as they
 * are, standing in for the human review) -> redaction -> re-read and
 * verification -> page images of the *redacted* PDF -> segmentDocument ->
 * buildTimeline. A document that fails verification is not sent. As in the
 * app, the birth year is read from the detections, locally, and only turns
 * ages into years once the model has answered (antecedents it cannot place
 * are kept in timeline.undated).
 *
 * Run from web/ (key from the environment, never printed):
 *   OPENROUTER_API_KEY=... npx vite-node scripts/run-frise.ts
 *   ... scripts/run-frise.ts --dossier=opiaces-tso --model=anthropic/claude-sonnet-5.5
 *
 * Output: data/processed/frise/[<--out>/]<dossier>.json, scored by
 *   uv run python scripts/score_frise.py
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

import { DEFAULT_MODEL } from "../src/cloud/client";
import type { CloudPolicy } from "../src/cloud/guard";
import { extractPageText, openPdf, redactPdf, renderPagePng, SCAN_TEXT_THRESHOLD } from "../src/core/pdf";
import type { PageText } from "../src/core/types";
import { buildManifest } from "../src/core/verify";
import { birthYearFromDetections } from "../src/notebook/age";
import { segmentDocument } from "../src/notebook/segment";
import { ARBITER, friseSettings, friseStep, READERS, reusedObservations } from "./frise-step";
import { detectCorpus } from "../src/pii/detect";

const ROOT = resolve(__dirname, "../..");
const DOSSIERS = resolve(ROOT, "data/anonymized/dossiers");
/** Identifiers planted in the fictional documents (they must all be gone). */
const PLANTED: Record<string, string[]> = JSON.parse(readFileSync(resolve(ROOT, "data/anonymized/ground_truth.json"), "utf8"));
const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase();
const FRISE = resolve(ROOT, "data/processed/frise");
/** Same zoom as the app's analysis (src/app/analysis.ts). */
const IMAGE_ZOOM = 1.3;

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");
const model = READERS.length ? `${READERS.join(" + ")}, arbitre ${ARBITER}` : (arg("model") ?? DEFAULT_MODEL);
const policy = { kind: "openrouter-zdr" as const, apiKey, model: arg("model") ?? DEFAULT_MODEL };
/** --segment-model: a cheaper model for the segmentation only (the frise keeps --model). */
const segmentModel = arg("segment-model");
/** --text-only: numbered lines without the page images (text-only models; measures what the images add). */
const TEXT_ONLY = process.argv.includes("--text-only");
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
    const res = await fetch(url, init);
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

  const reused = reusedObservations(FRISE, slug, new Set(sources.map((s) => s.id)));
  for (const src of sources) {
    const accepted = detections.filter((d) => d.doc === src.id && d.accepted);
    const output = redactPdf(src.bytes, accepted.map((d) => ({ page: d.page, rects: d.rects, label: d.label })));
    const outDoc = openPdf(output);
    const outPages = readPages(outDoc);
    const places = detections.filter((d) => d.doc === src.id && !d.accepted && d.category === "VILLE").map((d) => d.text);
    const manifest = await buildManifest(output, outPages, accepted, true, places);
    const readable = fold(outPages.map((p) => p.text).join("\n"));
    const planted = (PLANTED[`dossiers/${slug}/${src.id}.pdf`] ?? []).filter((id) => readable.includes(fold(id))).length;
    docs[src.id] = { pages: outPages.length, redactions: manifest.redactions, verified: manifest.verified, leaks: manifest.leaks.length, plantedLeft: planted };
    console.log(`${slug}/${src.id}: ${outPages.length} pages, ${accepted.length} masked, ${manifest.leaks.length} leaks, ${planted} planted identifiers left`);
    if (!manifest.verified || planted > 0) continue; // the guard would refuse the first, a reviewer the second

    pagesByDoc[src.id] = outPages;
    manifests[src.id] = manifest;
    if (reused) {
      observations.push(...reused.filter((o) => o.doc === src.id));
      continue;
    }
    const images: Record<number, string> = {};
    if (!TEXT_ONLY) for (const p of outPages) images[p.page] = `data:image/png;base64,${Buffer.from(renderPagePng(outDoc, p.page, IMAGE_ZOOM)).toString("base64")}`;
    const obs = await segmentDocument({ doc: src.id, pages: outPages, images, manifest, policy: segmentPolicy, fetchImpl });
    console.log(`  ${obs.length} observations`);
    observations.push(...obs);
  }

  const birthYear = birthYearFromDetections(detections);
  const { timeline, consensus, readings } = await friseStep({ observations, pagesByDoc, manifests, policy, fetchImpl, birthYear }, policy);
  if (consensus) console.log(`  consensus: ${JSON.stringify(consensus)}`);
  const fromAge = timeline.events.filter((e) => e.fromAge).length;
  console.log(
    `  frise: ${timeline.tracks.length} tracks, ${timeline.events.length} events (${fromAge} dated from an age), ` +
      `${timeline.undated.length} undated; birth year ${birthYear === null ? "unknown" : "known"}`,
  );
  return { dossier: slug, model, ...(segmentModel ? { segmentModel } : {}), ...(TEXT_ONLY ? { textOnly: true } : {}), ...friseSettings(), ranAt: new Date().toISOString(), review: "automatic detections accepted as they are", docs, observations, timeline, ...(consensus ? { consensus, readings } : {}) };
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
  writeFileSync(resolve(OUT, `${slug}.json`), JSON.stringify({ ...result, elapsedMs, usage: { ...spent, by: costBy }, rawAnswers }, null, 2) + "\n");
}
console.log(`total: ${usage.calls} calls, ${usage.promptTokens} + ${usage.completionTokens} tokens, $${usage.cost.toFixed(3)}`);
