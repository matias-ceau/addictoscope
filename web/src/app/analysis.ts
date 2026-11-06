/** Orchestrates the cloud analysis of verified documents. */
import { consensusPolicies, segmentationPolicy, type CloudPolicy } from "../cloud/guard";
import { buildConsensusTimeline } from "../notebook/consensus";
import type { Detection, PageText } from "../core/types";
import { birthYearFromDetections } from "../notebook/age";
import type { Manifest } from "../core/verify";
import type { Observation, Timeline } from "../notebook/model";
import { segmentDocument } from "../notebook/segment";
import { buildTimeline } from "../notebook/timeline";
import { renderPage } from "./engine";

export interface AnalysisDoc {
  id: string;
  pages: PageText[];
  manifest: Manifest | undefined;
}

export type AnalysisProgress =
  | { step: "images"; done: number; total: number }
  | { step: "segment"; done: number; total: number; doc: string }
  | { step: "timeline"; done: number; total: number };

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
): Promise<{ observations: Observation[]; timeline: Timeline }> {
  const analysed = new Set(docs.map((d) => d.id));
  const birthYear = birthYearFromDetections(detections.filter((d) => analysed.has(d.doc)));
  const observations: Observation[] = [];
  // The segmentation may use a cheaper model; the frise keeps the main one.
  const segmentPolicy = segmentationPolicy(policy);
  for (const doc of docs) {
    // Images come from the *pseudonymized* PDF, never from the original.
    const images: Record<number, string> = {};
    for (const page of doc.pages) {
      images[page.page] = await toDataUrl(await renderPage(`${doc.id}:pseudo`, page.page, IMAGE_ZOOM));
      onProgress({ step: "images", done: page.page + 1, total: doc.pages.length });
    }
    observations.push(
      ...(await segmentDocument({
        doc: doc.id,
        pages: doc.pages,
        images,
        manifest: doc.manifest,
        policy: segmentPolicy,
        fetchImpl,
        onProgress: (done, total) => onProgress({ step: "segment", done, total, doc: doc.id }),
      })),
    );
  }
  const input = {
    observations,
    pagesByDoc: Object.fromEntries(docs.map((d) => [d.id, d.pages])),
    manifests: Object.fromEntries(docs.map((d) => [d.id, d.manifest])),
    policy,
    onProgress: (done: number, total: number) => onProgress({ step: "timeline", done, total }),
    fetchImpl,
    birthYear,
  };
  // Consensus: the readers build the frise, the arbiter settles their disagreements.
  const consensus = consensusPolicies(policy);
  const timeline = consensus ? await buildConsensusTimeline({ ...input, consensus }) : await buildTimeline(input);
  return { observations, timeline };
}
