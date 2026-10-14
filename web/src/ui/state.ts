import type { Category, Detection, PageText } from "../core/types";
import { FIXED_LABELS } from "../pii/detect";
import type { NerSpan } from "../pii/ner";
import type { Manifest } from "../core/verify";

export type DocStatus = "reading" | "review" | "redacting" | "done" | "error";

export interface SourceDocState {
  id: string;
  name: string;
  /** Pseudonymous file name used for the download. */
  pseudoName: string;
  bytes: Uint8Array;
  status: DocStatus;
  progress?: { done: number; total: number; phase: "text" | "ocr" };
  pages: PageText[];
  /** Local AI model pass: runs in the background after the rules. */
  ner?: { status: "running" | "done" | "unavailable"; done: number; total: number; spans?: Record<number, NerSpan[]> };
  output?: Uint8Array;
  /** The pseudonymized output re-read from scratch (what the cloud model reads). */
  outPages?: PageText[];
  manifest?: Manifest;
  error?: string;
}

/** How the reviewer re-filed one detector entity. */
export interface EntityOverride {
  category: Category;
  label: string;
  entity: string;
}

export interface AppState {
  docs: SourceDocState[];
  detections: Detection[];
  /** Reviewer corrections, keyed by the detector's entity: they survive re-detection. */
  overrides?: Record<string, EntityOverride>;
  selectedDoc?: string;
  focusedDetection?: string;
}

export type Action =
  | { type: "add"; doc: SourceDocState }
  | { type: "patch"; id: string; patch: Partial<SourceDocState> }
  | { type: "remove"; id: string }
  | { type: "select"; id: string }
  | { type: "detections"; detections: Detection[] }
  | { type: "toggle"; ids: string[]; accepted: boolean }
  | { type: "addManual"; detection: Detection }
  /** Give an entity another category (and a fresh label in it). */
  | { type: "recategorise"; entity: string; category: Category }
  /** The two entities are one: `entity` takes the category and label of `into`. */
  | { type: "merge"; entity: string; into: string }
  | { type: "focus"; id?: string };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "add":
      return { ...state, docs: [...state.docs, action.doc], selectedDoc: state.selectedDoc ?? action.doc.id };
    case "patch":
      return { ...state, docs: state.docs.map((d) => (d.id === action.id ? { ...d, ...action.patch } : d)) };
    case "remove": {
      const docs = state.docs.filter((d) => d.id !== action.id);
      return {
        ...state,
        docs,
        detections: state.detections.filter((d) => d.doc !== action.id),
        selectedDoc: state.selectedDoc === action.id ? docs[0]?.id : state.selectedDoc,
      };
    }
    case "select":
      return { ...state, selectedDoc: action.id };
    case "detections":
      return { ...state, detections: applyOverrides(action.detections, state.overrides) };
    case "recategorise": {
      const label = FIXED_LABELS[action.category] ?? nextLabel(state.detections, action.category);
      // A shared label ("[PATIENT]", "[VILLE]") joins the group that already carries it.
      const joined = state.detections.find((d) => d.category === action.category && d.label === label);
      return refile(state, action.entity, { category: action.category, label, entity: joined?.entity ?? `${action.category}:${label}` });
    }
    case "merge": {
      const target = state.detections.find((d) => d.entity === action.into);
      if (!target || action.entity === action.into) return state;
      return refile(state, action.entity, { category: target.category, label: target.label, entity: target.entity });
    }
    case "toggle": {
      const ids = new Set(action.ids);
      return {
        ...state,
        detections: state.detections.map((d) => (ids.has(d.id) ? { ...d, accepted: action.accepted } : d)),
      };
    }
    case "addManual":
      return { ...state, detections: [...state.detections, action.detection] };
    case "focus":
      return { ...state, focusedDetection: action.id };
  }
}

/** The detector's entity behind a detection, whatever the reviewer did since. */
const originOf = (d: Detection) => d.origin ?? d.entity;

export function applyOverrides(detections: Detection[], overrides: AppState["overrides"]): Detection[] {
  if (!overrides) return detections;
  return detections.map((d) => {
    const o = overrides[originOf(d)];
    return o ? { ...d, ...o, origin: originOf(d) } : d;
  });
}

function refile(state: AppState, entity: string, to: EntityOverride): AppState {
  const overrides = { ...state.overrides };
  for (const d of state.detections) if (d.entity === entity) overrides[originOf(d)] = to;
  return { ...state, overrides, detections: applyOverrides(state.detections, overrides) };
}

/** The next unused numbered label of a category, e.g. "[ETABLISSEMENT_3]". */
function nextLabel(detections: Detection[], category: Category): string {
  const re = new RegExp(`^\\[${category}_(\\d+)\\]$`);
  const used = detections.map((d) => Number(re.exec(d.label)?.[1] ?? 0));
  return `[${category}_${Math.max(0, ...used) + 1}]`;
}

/**
 * Re-running detection (e.g. when a new document arrives) must not lose the
 * reviewer's work: keep manual boxes and carry over rejections.
 */
export function mergeDetections(previous: Detection[], fresh: Detection[]): Detection[] {
  const rejected = new Set(previous.filter((d) => !d.accepted).map((d) => `${d.doc}|${d.page}|${d.start}|${d.end}`));
  const manual = previous.filter((d) => d.source === "manual");
  return [
    ...fresh.map((d) => (rejected.has(`${d.doc}|${d.page}|${d.start}|${d.end}`) ? { ...d, accepted: false } : d)),
    ...manual,
  ];
}
