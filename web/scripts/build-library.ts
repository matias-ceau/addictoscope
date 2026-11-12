/**
 * Build a library of the fictional dossiers (web/public/library/), opened
 * by the app with ?library=library/library.json (SPEC.md, « Bibliothèque
 * de dossiers »).
 *
 *   npx vite-node scripts/build-library.ts [-- --run=age1 --long-run=longs/regroupe2 --only=alcool-depression,crack-rue --out=<dir>]
 *
 * Two groups: the long dossiers (20 to 30 pages, an intake observation that
 * retraces the whole journey) and the short ones. Per dossier: its PDFs and
 * the recorded run's analysis (observations and frise, format of
 * « Enregistrer l'analyse »). Fictional data only.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { openPdf } from "../src/core/pdf";
import { type BuiltDossier, readScores, shortSummary, writeAnalysis } from "./library-lib";

const ROOT = resolve(__dirname, "../..");
const ANONYMIZED = resolve(ROOT, "data/anonymized");
const FRISE = resolve(ROOT, "data/processed/frise");

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
/** In sidebar order: folder of data/anonymized, recorded run, scores of that run. */
const GROUPS = [
  { title: "Dossiers longs (20 à 30 pages)", root: "dossiers-longs", run: arg("long-run") ?? "longs/regroupe2", scores: "rapport-longs.json" },
  { title: "Dossiers courts", root: "dossiers", run: arg("run") ?? "age1", scores: "rapport-ages.json" },
];
const ONLY = arg("only")?.split(",");
const OUT = resolve(arg("out") ?? resolve(__dirname, "../public/library"));

/** Sidebar titles of the fictional dossiers. */
const TITLES: Record<string, string> = {
  "alcool-cirrhose": "Alcool et cirrhose",
  "alcool-depression": "Alcool et dépression",
  "alcool-rechutes": "Alcool : sept ans de rechutes et d'abstinences",
  "antalgiques-douleur": "Antalgiques opioïdes et douleur chronique",
  "cannabis-psychose": "Cannabis et premier épisode psychotique",
  "cocaine-cadre": "Cocaïne, jeu et TDAH chez un cadre",
  "opiaces-parcours": "Opiacés : neuf ans de méthadone",
  "polyconso-precarite": "Polyconsommation et précarité",
  "alcool-tspt": "Alcool et psychotraumatisme",
  "antalgiques-opioides": "Antalgiques opioïdes",
  "bupre-grossesse": "Buprénorphine et grossesse",
  "bzd-anxiete": "Benzodiazépines et anxiété",
  "cannabis-jeune": "Cannabis chez une jeune adulte",
  "cannabis-justice": "Cannabis et obligation de soins",
  "chemsex-prep": "Chemsex sous PrEP",
  "crack-rue": "Crack, rue et psychotraumatisme",
  "jeu-bipolaire": "Jeu d'argent et trouble bipolaire",
  "methadone-schizophrenie": "Méthadone et schizophrénie",
  "opiaces-tso": "Opiacés et traitement de substitution",
  "tabac-infarctus": "Tabac et infarctus",
};
const DOC_TITLE: Record<string, string> = {
  historique: "Historique des observations",
  courrier: "Courrier de sortie",
  urgences: "Compte rendu des urgences",
};

rmSync(OUT, { recursive: true, force: true });
const groups: { title: string; dossiers: BuiltDossier[] }[] = [];
for (const g of GROUPS) {
  const DOSSIERS = resolve(ANONYMIZED, g.root);
  const scores = readScores(resolve(FRISE, g.scores), g.run);
  const dossiers: BuiltDossier[] = [];
  for (const slug of readdirSync(DOSSIERS).sort()) {
    if (ONLY && !ONLY.includes(slug)) continue;
    const runPath = resolve(FRISE, g.run, `${slug}.json`);
    if (!existsSync(runPath)) continue;
    const run = JSON.parse(readFileSync(runPath, "utf8"));
    if (run.error || !run.timeline) continue;
    const dir = resolve(DOSSIERS, slug);
    mkdirSync(resolve(OUT, slug), { recursive: true });
    let pages = 0;
    const docs = readdirSync(dir)
      .filter((f) => f.endsWith(".pdf"))
      .sort()
      .map((f) => {
        copyFileSync(resolve(dir, f), resolve(OUT, slug, f));
        pages += openPdf(new Uint8Array(readFileSync(resolve(dir, f)))).countPages();
        const id = f.replace(/\.pdf$/, "");
        return { file: `${slug}/${f}`, id, title: DOC_TITLE[id] ?? id };
      });
    const verite = JSON.parse(readFileSync(resolve(dir, "verite.json"), "utf8"));
    dossiers.push({
      slug,
      title: TITLES[slug] ?? slug,
      summary: shortSummary(verite.summary ?? ""),
      docs,
      ...writeAnalysis(OUT, slug, run, scores[slug]?.estimatedCost),
      pages,
      events: run.timeline.events.length,
    });
    console.log(`${slug}: ${docs.length} documents, ${run.timeline.events.length} events`);
  }
  if (dossiers.length) groups.push({ title: g.title, dossiers });
}
const library = { title: "Dossiers fictifs", groups };
writeFileSync(resolve(OUT, "library.json"), JSON.stringify(library, null, 2) + "\n");
console.log(`${groups.reduce((n, g) => n + g.dossiers.length, 0)} dossiers -> ${OUT}`);
