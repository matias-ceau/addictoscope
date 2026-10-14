import type { Detection, PageText } from "../core/types";
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
  manifest?: Manifest;
  error?: string;
}

export interface AppState {
  docs: SourceDocState[];
  detections: Detection[];
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
      return { ...state, detections: action.detections };
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
