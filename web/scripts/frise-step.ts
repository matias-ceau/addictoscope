/**
 * The frise step shared by run-frise.ts (fictional dossiers) and
 * eval/run_frise_real.ts (real dossiers): one model, or a consensus
 * (--readers=<id>,<id> --arbiter=<id>, SPEC.md), with --chars=<n> for the
 * size of each call and --observations-from=<folder> to reuse the
 * segmentation of an earlier run (only the frise step then varies).
 * --consolidate: a frise read in several lots is regrouped, as in the app
 * (src/notebook/consolidate.ts); the frise as read is kept beside it.
 * --carry: each lot after the first is given the frise read so far.
 * --proofread: the frise is read again against the whole text
 * (src/notebook/proofread.ts); the frise before that is kept beside it.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { CloudPolicy } from "../src/cloud/guard";
import { buildConsensusTimeline, groupEvents, mergeAgreed, type ConsensusStats } from "../src/notebook/consensus";
import { consolidateTimeline } from "../src/notebook/consolidate";
import type { Observation, Timeline } from "../src/notebook/model";
import { proofreadTimeline } from "../src/notebook/proofread";
import { assembleTimeline, buildTimeline, lastObservationDate, lotCount, observationDates, type RawEvent, type TimelineInput } from "../src/notebook/timeline";

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

export const READERS = arg("readers")?.split(",").filter(Boolean) ?? [];
export const ARBITER = arg("arbiter");
export const CHARS = arg("chars") ? Number(arg("chars")) : undefined;
export const OBSERVATIONS_FROM = arg("observations-from");
export const CONSOLIDATE = process.argv.includes("--consolidate");
export const CARRY = process.argv.includes("--carry");
export const PROOFREAD = process.argv.includes("--proofread");
if (READERS.length === 1 || (READERS.length > 0 && !ARBITER)) throw new Error("--readers needs at least two models and --arbiter");

/** Settings to record in the run's JSON. */
export const friseSettings = () => ({
  ...(READERS.length ? { readers: READERS, arbiter: ARBITER } : {}),
  ...(CHARS ? { charsPerCall: CHARS } : {}),
  ...(OBSERVATIONS_FROM ? { observationsFrom: OBSERVATIONS_FROM } : {}),
  ...(CONSOLIDATE ? { consolidate: true } : {}),
  ...(CARRY ? { carry: true } : {}),
  ...(PROOFREAD ? { proofread: true } : {}),
});

/** Observations of an earlier run of this dossier, for the documents sent now; null when not asked. */
export function reusedObservations(base: string, slug: string, docs: Set<string>): Observation[] | null {
  if (!OBSERVATIONS_FROM) return null;
  const path = resolve(base, OBSERVATIONS_FROM, `${slug}.json`);
  if (!existsSync(path)) throw new Error(`no earlier run to take the observations from (${OBSERVATIONS_FROM})`);
  const run = JSON.parse(readFileSync(path, "utf8")) as { observations?: Observation[] };
  if (!run.observations) throw new Error(`the earlier run has no observations (${OBSERVATIONS_FROM})`);
  return run.observations.filter((o) => docs.has(o.doc));
}

export interface FriseResult {
  timeline: Timeline;
  /** --consolidate, several lots: the frise as read, before the regroupement. */
  timelineRead?: Timeline;
  /** --proofread: the frise before it was read again against the text. */
  timelineUnchecked?: Timeline;
  consensus?: ConsensusStats;
  /** Consensus: each reader's own frise on the same observations (single-model baselines), and their union without arbiter ("union"). */
  readings?: { model: string; timeline: Timeline }[];
}

export async function friseStep(input: TimelineInput, policy: Extract<CloudPolicy, { kind: "openrouter-zdr" }>): Promise<FriseResult> {
  const built = await builtStep(input, policy);
  if (!PROOFREAD) return built;
  const checked = await proofreadTimeline(built.timeline, { ...input, policy });
  return { ...built, timeline: checked, timelineUnchecked: built.timeline };
}

async function builtStep(input: TimelineInput, policy: Extract<CloudPolicy, { kind: "openrouter-zdr" }>): Promise<FriseResult> {
  const result = await readStep(input, policy);
  const lots = CONSOLIDATE ? lotCount({ ...input, ...(CHARS ? { charsPerCall: CHARS } : {}) }) : 1;
  if (lots < 2) return result;
  const regrouped = await consolidateTimeline(result.timeline, { ...input, policy: ARBITER ? { ...policy, model: ARBITER } : policy }, lots);
  return { ...result, timeline: regrouped, timelineRead: result.timeline };
}

async function readStep(input: TimelineInput, policy: Extract<CloudPolicy, { kind: "openrouter-zdr" }>): Promise<FriseResult> {
  const withChars = { ...input, policy, ...(CHARS ? { charsPerCall: CHARS } : {}), ...(CARRY ? { carry: true } : {}) };
  if (!READERS.length) return { timeline: await buildTimeline(withChars) };
  let runs: RawEvent[][] = [];
  const timeline = await buildConsensusTimeline({
    ...withChars,
    consensus: { readers: READERS.map((model) => ({ ...policy, model })), arbiter: { ...policy, model: ARBITER! } },
    onReadings: (r) => (runs = r),
  });
  const known = new Set(input.observations.map((o) => o.id));
  const last = lastObservationDate(input.observations);
  const assemble = (raw: RawEvent[]) => assembleTimeline(raw, known, input.birthYear ?? null, last, observationDates(input.observations));
  // Union without arbiter: agreements merged, every dispute kept as first read.
  const union = groupEvents(runs).map((g) => {
    const present = g.members.filter((m): m is RawEvent => m !== null);
    return g.agreed ? mergeAgreed(present) : present[0];
  });
  const readings = [
    ...runs.map((raw, i) => ({ model: READERS[i], timeline: assemble(raw) })),
    { model: "union", timeline: assemble(union) },
  ];
  const { consensus, ...rest } = timeline;
  return { timeline: rest, consensus, readings };
}
