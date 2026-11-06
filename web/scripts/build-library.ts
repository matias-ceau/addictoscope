/**
 * Build a library of the fictional dossiers (web/public/library/), opened
 * by the app with ?library=library/library.json (SPEC.md, « Bibliothèque
 * de dossiers »).
 *
 *   npx vite-node scripts/build-library.ts [-- --run=age1 --only=alcool-depression,crack-rue --out=<dir>]
 *
 * Per dossier: its PDFs and the recorded run's analysis (observations and
 * frise, format of « Enregistrer l'analyse »). Fictional data only.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { type BuiltDossier, shortSummary, writeAnalysis } from "./library-lib";

const ROOT = resolve(__dirname, "../..");
const DOSSIERS = resolve(ROOT, "data/anonymized/dossiers");
const FRISE = resolve(ROOT, "data/processed/frise");

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const RUN = arg("run") ?? "age1";
const ONLY = arg("only")?.split(",");
const OUT = resolve(arg("out") ?? resolve(__dirname, "../public/library"));

/** Sidebar titles of the fictional dossiers. */
const TITLES: Record<string, string> = {
  "alcool-cirrhose": "Alcool et cirrhose",
  "alcool-depression": "Alcool et dépression",
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
const dossiers: BuiltDossier[] = [];
for (const slug of readdirSync(DOSSIERS).sort()) {
  if (ONLY && !ONLY.includes(slug)) continue;
  const runPath = resolve(FRISE, RUN, `${slug}.json`);
  if (!existsSync(runPath)) continue;
  const run = JSON.parse(readFileSync(runPath, "utf8"));
  if (run.error || !run.timeline) continue;
  const dir = resolve(DOSSIERS, slug);
  mkdirSync(resolve(OUT, slug), { recursive: true });
  const docs = readdirSync(dir)
    .filter((f) => f.endsWith(".pdf"))
    .sort()
    .map((f) => {
      copyFileSync(resolve(dir, f), resolve(OUT, slug, f));
      const id = f.replace(/\.pdf$/, "");
      return { file: `${slug}/${f}`, id, title: DOC_TITLE[id] ?? id };
    });
  const verite = JSON.parse(readFileSync(resolve(dir, "verite.json"), "utf8"));
  dossiers.push({
    slug,
    title: TITLES[slug] ?? slug,
    summary: shortSummary(verite.summary ?? ""),
    docs,
    ...writeAnalysis(OUT, slug, run),
    events: run.timeline.events.length,
  });
  console.log(`${slug}: ${docs.length} documents, ${run.timeline.events.length} events`);
}
const library = { title: "Dossiers fictifs", groups: [{ title: "Dossiers fictifs", dossiers }] };
writeFileSync(resolve(OUT, "library.json"), JSON.stringify(library, null, 2) + "\n");
console.log(`${dossiers.length} dossiers -> ${OUT}`);
