/**
 * Timeline data model, mirroring src/addictoscope/models.py (Auriacombe et
 * al. 2018 swimlanes): fixed track kinds, any number of tracks per kind.
 */
import type { AgeRange } from "./age";

export type { AgeRange };
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
  substance_use: "Usages et comportements",
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
  /** The other labels the same thing was read under, once its tracks were
   *  regrouped ("Hépatite C" also read as "VHC"). */
  aliases?: string[];
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
  /** Frise by consensus: every reading had it, the arbiter kept it, or it
   *  was kept as read for want of a decision. Absent for a single reading. */
  consensus?: "agreed" | "arbitrated" | "unarbitrated";
  /** Present when a bound was computed from an age: drawn as approximate. */
  fromAge?: { start: AgeRange | null; end: AgeRange | null };
  /** The text gives no start ("HTA traitée", "arrêté en mai"): the event is
   *  placed at the first observation that mentions it, or at its end when it
   *  ended before. Drawn as approximate. */
  startUnknown?: true;
  /** Regroupement (consolidate.ts): the tellings merged into this event. */
  tellings?: Telling[];
  /** Corrected by hand on this device (edit.ts): added, or changed. */
  edited?: "added" | "changed";
  /** Verdict given by the reader going through the list. */
  verdict?: "ok" | "wrong";
  /** Landmark of the "Essentiel" view: forced in (true) or out (false);
   *  absent, the automatic selection decides. */
  key?: boolean;
}

/** An event deleted by hand: kept so that reading the dossier again does
 *  not bring it back. */
export interface RemovedEvent {
  kind: TrackKind;
  label: string;
  start: string;
}

/** One mention of a fact, as read in one lot, before the tellings were merged. */
export interface Telling {
  /** null when that telling gave no start. */
  start: string | null;
  end: string | null;
  note: string;
  observationIds: string[];
}

/** Do two tellings give dates that cannot both be right ("2013", "2014-10-14")?
 *  A coarser date that contains the other ("2014", "2014-10") is not a disagreement. */
export function tellingsDisagree(tellings: Telling[] | undefined): boolean {
  const starts = [...new Set((tellings ?? []).flatMap((t) => (t.start ? [t.start] : [])))];
  return starts.some((a, i) => starts.slice(i + 1).some((b) => !a.startsWith(b) && !b.startsWith(a)));
}

/** An antecedent told by age that could not be placed on the axis (no birth
 *  date known locally, or a year past the last observation). */
export type UndatedEvent = Omit<TimelineEvent, "start" | "end" | "fromAge" | "startUnknown" | "tellings"> & {
  startAge: AgeRange;
  endAge: AgeRange | null;
};

export interface ConsensusStats {
  readers: number;
  /** Events every reading had, compatibly. */
  agreed: number;
  disputed: number;
  /** Disputes the arbiter kept (possibly corrected). */
  kept: number;
  dropped: number;
  /** Disputes kept as read because the arbiter gave no usable decision. */
  unarbitrated: number;
}

/** What the regroupement did to a frise read in several lots (SPEC.md). */
export interface ConsolidationStats {
  /** Independent lots the frise was read in. */
  lots: number;
  tracksBefore: number;
  tracksAfter: number;
  eventsBefore: number;
  eventsAfter: number;
  /** Merged events whose tellings give dates that cannot both be right. */
  discordant: number;
  /** The call failed: the frise is the one read, not regrouped. */
  failed?: string;
}

export interface Timeline {
  tracks: Track[];
  events: TimelineEvent[];
  /** Missing from frises made before ages were handled: read as []. */
  undated: UndatedEvent[];
  /** Present when the frise was built by consensus. */
  consensus?: ConsensusStats;
  /** Present when the frise was read in several lots and regrouped. */
  consolidation?: ConsolidationStats;
  /** Events deleted by hand. */
  removed?: RemovedEvent[];
  /** What the reader found missing, in their own words. */
  missing?: string;
}

/** A timeline read from older JSON (no `undated`) brought to the current shape. */
export function withUndated(t: Omit<Timeline, "undated"> & { undated?: UndatedEvent[] }): Timeline {
  return { ...t, undated: t.undated ?? [] };
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
