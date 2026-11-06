/** Helpers shared by build-library.ts and the private builder of real dossiers. */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { serializeAnalysis } from "../src/app/saved";

/** First sentences of the dossier summary, without the note on the export format. */
export function shortSummary(s: string): string {
  return s
    .split(/(?<=\.)\s+/)
    .filter((x) => !/^Export|format/i.test(x))
    .slice(0, 2)
    .join(" ");
}

export interface BuiltDossier {
  slug: string;
  title: string;
  summary: string;
  docs: { file: string; id: string; title: string }[];
  analysis: string;
  key?: string;
  cost?: number;
  events: number;
}

/** Writes <out>/<slug>/analysis.json from a run of run-frise.ts; returns the library entry. */
export function writeAnalysis(out: string, slug: string, run: { model: string; ranAt?: string; observations: unknown[]; timeline: unknown; usage?: { cost?: number } }) {
  mkdirSync(resolve(out, slug), { recursive: true });
  const text = serializeAnalysis(
    { observations: run.observations as never, timeline: run.timeline as never, model: run.model },
    run.ranAt ? new Date(run.ranAt) : new Date(),
  );
  writeFileSync(resolve(out, slug, "analysis.json"), text + "\n");
  return { analysis: `${slug}/analysis.json`, ...(run.usage?.cost !== undefined ? { cost: run.usage.cost } : {}) };
}
