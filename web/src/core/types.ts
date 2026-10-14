/** A rectangle in PDF page space (points, origin top-left, y down). */
export type Rect = [x0: number, y0: number, x1: number, y1: number];

/** One whitespace-delimited token on a page, located by its bounding box. */
export interface Word {
  text: string;
  rect: Rect;
  /** Offsets of this word in its page's `text`. */
  start: number;
  end: number;
}

/** A page's text, flattened to one string whose offsets map back to words. */
export interface PageText {
  page: number;
  width: number;
  height: number;
  text: string;
  words: Word[];
  /** "pdf" when read from the text layer, "ocr" when recovered from pixels. */
  source: "pdf" | "ocr";
}

export type Category =
  | "PATIENT"
  | "PROCHE"
  | "SOIGNANT"
  | "PERSONNE"
  | "ADRESSE"
  | "VILLE"
  | "ETABLISSEMENT"
  | "NAISSANCE"
  | "IPP"
  | "NIR"
  | "DOSSIER"
  | "TEL"
  | "EMAIL";

export type DetectionSource = "rule" | "name" | "propagation" | "manual" | "ner";

/** A candidate identifier on one page. */
export interface Detection {
  id: string;
  doc: string;
  page: number;
  start: number;
  end: number;
  text: string;
  category: Category;
  source: DetectionSource;
  /** Groups detections that refer to the same real-world entity. */
  entity: string;
  /** The entity the detector assigned, kept when the reviewer re-files it. */
  origin?: string;
  /** Text drawn in place of the redacted area, e.g. "[SOIGNANT_2]". */
  label: string;
  rects: Rect[];
  accepted: boolean;
}

export const PERSON_CATEGORIES: ReadonlySet<Category> = new Set([
  "PATIENT",
  "PROCHE",
  "SOIGNANT",
  "PERSONNE",
]);
