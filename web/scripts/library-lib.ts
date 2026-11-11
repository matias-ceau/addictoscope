/** Helpers shared by build-library.ts and the private builder of real dossiers. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
  costEstimated?: boolean;
  pages?: number;
  events: number;
}

/** Per-dossier counts of a scored run (scripts/score_frise.py, `rapport*.json`). */
export type RunScores = Record<string, { found: number; expected: number; estimatedCost?: number }>;

export function readScores(path: string, run: string): RunScores {
  if (!existsSync(path)) return {};
  const all = JSON.parse(readFileSync(path, "utf8")) as { run: string; perDossier: RunScores }[];
  return all.find((x) => x.run === run.split("/").at(-1))?.perDossier ?? {};
}

/**
 * What a run cost. One answered from files (no paid call) was billed
 * nothing: its cost is the estimate of the scoring script, marked as such.
 */
export function runCost(run: { transport?: string; usage?: { cost?: number } }, estimated?: number): { cost?: number; costEstimated?: boolean } {
  if (run.transport === "files") return estimated !== undefined ? { cost: estimated, costEstimated: true } : {};
  return run.usage?.cost !== undefined ? { cost: run.usage.cost } : {};
}

/** Writes <out>/<slug>/analysis.json from a run of run-frise.ts; returns the library entry. */
export function writeAnalysis(
  out: string,
  slug: string,
  run: { model: string; ranAt?: string; observations: unknown[]; timeline: unknown; transport?: string; usage?: { cost?: number } },
  estimatedCost?: number,
) {
  mkdirSync(resolve(out, slug), { recursive: true });
  const text = serializeAnalysis(
    { observations: run.observations as never, timeline: run.timeline as never, model: run.model },
    run.ranAt ? new Date(run.ranAt) : new Date(),
  );
  writeFileSync(resolve(out, slug, "analysis.json"), text + "\n");
  return { analysis: `${slug}/analysis.json`, ...runCost(run, estimatedCost) };
}
