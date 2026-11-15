/**
 * Build the demonstration bundle (web/public/demo/) from the fictional
 * dossiers and recorded runs of web/scripts/run-frise.ts.
 *
 *   npx vite-node scripts/build-demo.ts -- --runs=age1,bench/openai__gpt-6-luna,bench/anthropic__claude-haiku-5.5
 *
 * Per dossier: its PDFs, and one recording per run (the model's raw answers
 * in call order, cost, duration), replayed by the app instead of the network.
 * The long dossier comes with its own run (--long-run=longs/regroupe2): four
 * lots and their regroupement, answered from files, hence an estimated cost.
 * Each document also comes with what the local name model finds in it
 * (<file>.ner.json, computed here with the app's own model and code): the
 * demonstration shows that result at once instead of running the model
 * again on the visitor's device, which takes minutes on a phone.
 * Fictional data only: everything here is already public in data/anonymized.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { AutoModelForTokenClassification, AutoTokenizer, env } from "@huggingface/transformers";

import { extractPageText, openPdf } from "../src/core/pdf";
import { nerSpans, type NerSpan } from "../src/pii/ner";
import { readScores, runCost, type RunScores } from "./library-lib";

const ROOT = resolve(__dirname, "../..");
const ANONYMIZED = resolve(ROOT, "data/anonymized");
const FRISE = resolve(ROOT, "data/processed/frise");
const OUT = resolve(__dirname, "../public/demo");

/** Dossiers shown on the welcome screen, in order. `long`: one of dossiers-longs, with its own run. */
const DEMO: { slug: string; title: string; summary: string; long?: true }[] = [
  {
    slug: "opiaces-parcours",
    long: true,
    title: "Dossier long : neuf ans de méthadone",
    summary:
      "Femme de 29 ans à l'entrée : héroïne, méthadone de 2017 à 2026, grossesse, surdose, crack, TSPT. Une observation d'entrée qui retrace le parcours, puis neuf ans de suivi ; des éléments ne sont révélés que tard.",
  },
  {
    slug: "alcool-depression",
    title: "Alcool et dépression",
    summary:
      "Femme de 50 ans : trouble de l'usage de l'alcool sévère, épisode dépressif. Urgences, sevrage hospitalier, 14 mois de suivi, deuil, rechute.",
  },
  {
    slug: "crack-rue",
    title: "Crack, rue et psychotraumatisme",
    summary:
      "Femme de 32 ans sans domicile : crack et alcool, TSPT complexe. Décès de son ex-compagnon par overdose, pneumopathie, CHRS, EMDR.",
  },
  {
    slug: "chemsex-prep",
    title: "Chemsex sous PrEP",
    summary:
      "Homme de 37 ans : 3-MMC injectée, GHB/GBL. Coma au GHB, sevrage hospitalier, épisode dépressif, rechute. Format « fiche d'observations ».",
  },
  {
    slug: "cannabis-jeune",
    title: "Cannabis chez une jeune adulte",
    summary:
      "Femme de 21 ans en consultation jeunes consommateurs : hyperémèse cannabinoïde, trouble panique, TDAH discuté.",
  },
];

const DOC_TITLE: Record<string, string> = {
  historique: "Historique des observations",
  courrier: "Courrier de sortie",
  urgences: "Compte rendu des urgences",
};

/** Per-dossier recall of each run, from scripts/compare_models.py. */
const scores: { run: string; perDossier: RunScores }[] = existsSync(resolve(FRISE, "comparaison-modeles.json"))
  ? JSON.parse(readFileSync(resolve(FRISE, "comparaison-modeles.json"), "utf8"))
  : [];

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const runs = (arg("runs") ?? "age1").split(",");
const longRun = arg("long-run") ?? "longs/regroupe2";
const longScores = readScores(resolve(FRISE, "rapport-longs.json"), longRun);

env.localModelPath = resolve(__dirname, "../public/models") + "/";
env.allowRemoteModels = false;
const tokenizer = await AutoTokenizer.from_pretrained("Xenova/camembert-ner");
const model = await AutoModelForTokenClassification.from_pretrained("Xenova/camembert-ner", { dtype: "q8" });

rmSync(OUT, { recursive: true, force: true });
const index = [];
for (const d of DEMO) {
  const dir = resolve(ANONYMIZED, d.long ? "dossiers-longs" : "dossiers", d.slug);
  mkdirSync(resolve(OUT, d.slug), { recursive: true });
  const files = readdirSync(dir).filter((f) => f.endsWith(".pdf")).sort();
  const docs = [];
  for (const f of files) {
    copyFileSync(resolve(dir, f), resolve(OUT, d.slug, f));
    const stem = f.replace(/\.pdf$/, "");
    const pdf = openPdf(new Uint8Array(readFileSync(resolve(dir, f))));
    const pages = pdf.countPages();
    const spans: Record<number, NerSpan[]> = {};
    for (let i = 0; i < pages; i++) {
      const page = extractPageText(pdf, i);
      spans[page.page] = (await nerSpans(page.text, tokenizer, model)).map((s) => ({ ...s, score: Math.round(s.score * 1000) / 1000 }));
    }
    writeFileSync(resolve(OUT, d.slug, `${stem}.ner.json`), JSON.stringify(spans) + "\n");
    docs.push({ file: f, title: DOC_TITLE[stem] ?? stem, pages, ner: `${stem}.ner.json` });
  }
  const recordings = [];
  for (const run of d.long ? [longRun] : runs) {
    const path = resolve(FRISE, run, `${d.slug}.json`);
    if (!existsSync(path)) throw new Error(`missing run ${run} for ${d.slug}`);
    const r = JSON.parse(readFileSync(path, "utf8"));
    if (r.error || !r.rawAnswers?.length) throw new Error(`run ${run} failed for ${d.slug}`);
    const name = run.replace(/\//g, "__");
    const scored = d.long ? longScores[d.slug] : scores.find((x) => x.run === run.split("/").at(-1))?.perDossier[d.slug];
    // Answered from files: nothing was billed and nothing was timed.
    const fromFiles = r.transport === "files";
    const { cost = 0, costEstimated } = runCost(r, scored?.estimatedCost);
    const elapsedMs = fromFiles ? null : (r.elapsedMs ?? null);
    writeFileSync(
      resolve(OUT, d.slug, `${name}.json`),
      JSON.stringify({ model: r.model, cost, elapsedMs: elapsedMs ?? 0, answers: r.rawAnswers, ...(r.segmentation ? { segmentation: r.segmentation } : {}) }) + "\n",
    );
    const score = scored ? { found: scored.found, expected: scored.expected } : null;
    recordings.push({ file: `${name}.json`, model: r.model, cost, ...(costEstimated ? { costEstimated } : {}), elapsedMs, events: r.timeline.events.length, score });
  }
  const { long: _long, ...entry } = d;
  index.push({ ...entry, docs, recordings });
  console.log(`${d.slug}: ${docs.length} documents, ${recordings.length} recordings`);
}
writeFileSync(resolve(OUT, "index.json"), JSON.stringify({ dossiers: index }, null, 2) + "\n");
