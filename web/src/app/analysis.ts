/** Orchestrates the cloud analysis of verified documents. */
import { consensusPolicies, segmentationPolicy, type CloudPolicy } from "../cloud/guard";
import { buildConsensusTimeline } from "../notebook/consensus";
import { consolidateTimeline } from "../notebook/consolidate";
import type { Detection, PageText } from "../core/types";
import { birthYearFromDetections } from "../notebook/age";
import type { Manifest } from "../core/verify";
import type { Observation, Timeline } from "../notebook/model";
import { segmentRulesFirst, type SegmentedBy } from "../notebook/segment-rules";
import { buildTimeline, lotCount } from "../notebook/timeline";
import { renderPage } from "./engine";

export interface AnalysisDoc {
  id: string;
  pages: PageText[];
  manifest: Manifest | undefined;
}

export type AnalysisProgress =
  | { step: "images"; done: number; total: number }
  | { step: "segment"; done: number; total: number; doc: string }
  | { step: "timeline"; done: number; total: number }
  | { step: "consolidate"; done: number; total: number };

/** Model input resolution: enough to read a page, small enough to stay cheap. */
const IMAGE_ZOOM = 1.3;

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export async function analyse(
  docs: AnalysisDoc[],
  policy: CloudPolicy,
  onProgress: (p: AnalysisProgress) => void,
  /** The session's detections: the birth year is read from them here, in
   *  the browser, and only used once the model has answered. */
  detections: Detection[] = [],
  /** Replaces the network, e.g. recorded answers in the demonstration. */
  fetchImpl?: typeof fetch,
  /** "model": every document is split by the model, as before the rules
   *  existed (answers recorded then are replayed in the same order). */
  segmentation: "rules-first" | "model" = "rules-first",
  /** A frise read in several lots is regrouped by one more call, without any
   *  observation text (SPEC.md). false: left as read, e.g. to replay a
   *  recording made before the regroupement existed. */
  consolidate = true,
  /** false: events without a start are dropped instead of placed at their
   *  first mention, to replay a recording made before they were. */
  placeUnknownStarts = true,
): Promise<{ observations: Observation[]; timeline: Timeline; segmentedBy: Record<string, SegmentedBy> }> {
  const analysed = new Set(docs.map((d) => d.id));
  const birthYear = birthYearFromDetections(detections.filter((d) => analysed.has(d.doc)));
  const observations: Observation[] = [];
  // The segmentation may use a cheaper model; the frise keeps the main one.
  const segmentPolicy = segmentationPolicy(policy);
  const segmentedBy: Record<string, SegmentedBy> = {};
  for (const doc of docs) {
    // A known layout is split here, by rules: no call, no page image. For the
    // others the model reads images of the *pseudonymized* PDF, never of the original.
    const images = async () => {
      const out: Record<number, string> = {};
      for (const page of doc.pages) {
        out[page.page] = await toDataUrl(await renderPage(`${doc.id}:pseudo`, page.page, IMAGE_ZOOM));
        onProgress({ step: "images", done: page.page + 1, total: doc.pages.length });
      }
      return out;
    };
    const { observations: found, by } = await segmentRulesFirst({
      doc: doc.id,
      pages: doc.pages,
      images,
      manifest: doc.manifest,
      policy: segmentPolicy,
      fetchImpl,
      onProgress: (done, total) => onProgress({ step: "segment", done, total, doc: doc.id }),
      rules: segmentation === "rules-first",
    });
    observations.push(...found);
    segmentedBy[doc.id] = by;
  }
  const input = {
    observations,
    pagesByDoc: Object.fromEntries(docs.map((d) => [d.id, d.pages])),
    manifests: Object.fromEntries(docs.map((d) => [d.id, d.manifest])),
    policy,
    onProgress: (done: number, total: number) => onProgress({ step: "timeline", done, total }),
    fetchImpl,
    birthYear,
    placeUnknownStarts,
  };
  // Consensus: the readers build the frise, the arbiter settles their disagreements.
  const consensus = consensusPolicies(policy);
  const read = consensus ? await buildConsensusTimeline({ ...input, consensus }) : await buildTimeline(input);
  // Lots are read independently and a long dossier retells its past: the same
  // fact comes back from several lots. One lot has seen everything at once.
  const lots = consolidate ? lotCount(input) : 1;
  if (lots < 2) return { observations, timeline: read, segmentedBy };
  onProgress({ step: "consolidate", done: 0, total: 1 });
  const timeline = await consolidateTimeline(read, { ...input, policy: consensus?.arbiter ?? policy }, lots);
  onProgress({ step: "consolidate", done: 1, total: 1 });
  return { observations, timeline, segmentedBy };
}
