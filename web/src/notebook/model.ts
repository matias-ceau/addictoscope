/**
 * Timeline data model, mirroring src/addictoscope/models.py (Auriacombe et
 * al. 2018 swimlanes): fixed track kinds, any number of tracks per kind.
 */
export const TRACK_KINDS = [
  "substance_use",
  "psychiatric",
  "somatic",
  "medication",
  "therapeutic_psycho",
  "life_event",
] as const;
export type TrackKind = (typeof TRACK_KINDS)[number];

export const USAGE_MODES = ["usage", "intoxication", "sevrage", "rechute", "craving"] as const;
export type UsageMode = (typeof USAGE_MODES)[number];

export const TRACK_KIND_LABEL: Record<TrackKind, string> = {
  substance_use: "Consommations",
  psychiatric: "Psychopathologie",
  somatic: "Somatique",
  medication: "Médicaments",
  therapeutic_psycho: "Prises en charge",
  life_event: "Événements de vie",
};

/** A clinical observation located in a pseudonymized document. */
export interface Observation {
  id: string;
  doc: string;
  start: { page: number; line: number };
  end: { page: number; line: number };
  /** ISO date of the clinical encounter (not the validation date). */
  date: string | null;
  kind: string;
  authorRole: string | null;
  summary: string;
}

export interface Track {
  id: string;
  kind: TrackKind;
  label: string;
}

export interface TimelineEvent {
  id: string;
  trackId: string;
  /** "YYYY", "YYYY-MM" or "YYYY-MM-DD": precision is kept as written. */
  start: string;
  end: string | null;
  ongoing: boolean;
  mode: UsageMode | null;
  lossOfControl: boolean;
  note: string;
  observationIds: string[];
}

export interface Timeline {
  tracks: Track[];
  events: TimelineEvent[];
}

const PARTIAL_DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;

export function isPartialDate(s: unknown): s is string {
  if (typeof s !== "string" || !PARTIAL_DATE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  if (y < 1900 || y > 2100) return false;
  if (m !== undefined && (m < 1 || m > 12)) return false;
  if (d !== undefined && (d < 1 || d > 31)) return false;
  return true;
}

/** Start of a partial date as a timestamp (first day of the period). */
export function dateStart(s: string): number {
  const [y, m = 1, d = 1] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** End of a partial date as a timestamp (last instant of the period). */
export function dateEnd(s: string): number {
  const parts = s.split("-").map(Number);
  if (parts.length === 1) return Date.UTC(parts[0] + 1, 0, 1) - 1;
  if (parts.length === 2) return Date.UTC(parts[0], parts[1], 1) - 1;
  return Date.UTC(parts[0], parts[1] - 1, parts[2] + 1) - 1;
}
