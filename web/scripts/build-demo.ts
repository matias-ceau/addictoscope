/**
 * Build the demonstration bundle (web/public/demo/) from the fictional
 * dossiers and recorded runs of web/scripts/run-frise.ts.
 *
 *   npx vite-node scripts/build-demo.ts -- --runs=age1,bench/anthropic__claude-haiku-5.5
 *
 * Per dossier: its PDFs, and one recording per run (the model's raw answers
 * in call order, cost, duration), replayed by the app instead of the network.
 * Fictional data only: everything here is already public in data/anonymized.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { openPdf } from "../src/core/pdf";

const ROOT = resolve(__dirname, "../..");
const DOSSIERS = resolve(ROOT, "data/anonymized/dossiers");
const FRISE = resolve(ROOT, "data/processed/frise");
const OUT = resolve(__dirname, "../public/demo");

/** Dossiers shown on the welcome screen, in order. */
const DEMO: { slug: string; title: string; summary: string }[] = [
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
const scores: { run: string; perDossier: Record<string, { found: number; expected: number }> }[] = existsSync(resolve(FRISE, "comparaison-modeles.json"))
  ? JSON.parse(readFileSync(resolve(FRISE, "comparaison-modeles.json"), "utf8"))
  : [];

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const runs = (arg("runs") ?? "age1").split(",");

rmSync(OUT, { recursive: true, force: true });
const index = [];
for (const d of DEMO) {
  const dir = resolve(DOSSIERS, d.slug);
  mkdirSync(resolve(OUT, d.slug), { recursive: true });
  const files = readdirSync(dir).filter((f) => f.endsWith(".pdf")).sort();
  const docs = files.map((f) => {
    copyFileSync(resolve(dir, f), resolve(OUT, d.slug, f));
    const stem = f.replace(/\.pdf$/, "");
    return { file: f, title: DOC_TITLE[stem] ?? stem, pages: openPdf(new Uint8Array(readFileSync(resolve(dir, f)))).countPages() };
  });
  const recordings = [];
  for (const run of runs) {
    const path = resolve(FRISE, run, `${d.slug}.json`);
    if (!existsSync(path)) throw new Error(`missing run ${run} for ${d.slug}`);
    const r = JSON.parse(readFileSync(path, "utf8"));
    if (r.error || !r.rawAnswers?.length) throw new Error(`run ${run} failed for ${d.slug}`);
    const name = run.replace(/\//g, "__");
    writeFileSync(
      resolve(OUT, d.slug, `${name}.json`),
      JSON.stringify({ model: r.model, cost: r.usage?.cost ?? 0, elapsedMs: r.elapsedMs ?? 0, answers: r.rawAnswers }) + "\n",
    );
    const score = scores.find((x) => x.run === run.split("/").at(-1))?.perDossier[d.slug] ?? null;
    recordings.push({ file: `${name}.json`, model: r.model, cost: r.usage?.cost ?? 0, elapsedMs: r.elapsedMs ?? null, events: r.timeline.events.length, score });
  }
  index.push({ ...d, docs, recordings });
  console.log(`${d.slug}: ${docs.length} documents, ${recordings.length} recordings`);
}
writeFileSync(resolve(OUT, "index.json"), JSON.stringify({ dossiers: index }, null, 2) + "\n");
