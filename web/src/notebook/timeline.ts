/**
 * Turn observations into a frise: the model reads the observations (text
 * only — they are already located and dated) and returns typed events, each
 * citing the observations it comes from. Code merges tracks and validates.
 */
import { chatJson } from "../cloud/client";
import type { CloudPolicy } from "../cloud/guard";
import type { PageText } from "../core/types";
import type { Manifest } from "../core/verify";
import { linesBetween, repeatedLines } from "./lines";
import { parseAge } from "./age";
import {
  isPartialDate,
  TRACK_KINDS,
  USAGE_MODES,
  type Observation,
  type Timeline,
  type TimelineEvent,
  type Track,
  type TrackKind,
  type UndatedEvent,
} from "./model";

/** Characters of observation text per call. */
export const CHARS_PER_CALL = 24_000;

/** An age (14), an inclusive range ([12, 17]) or a named period ("adolescence"). */
const AGE_SCHEMA = {
  anyOf: [{ type: "number" }, { type: "array", items: { type: "number" } }, { type: "string" }, { type: "null" }],
  description: "âge en années : 14, [12, 17], « enfance », « adolescence » ou « jeune adulte » ; null si la date est connue",
};

export const TIMELINE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["events"],
  properties: {
    events: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "label", "start", "end", "start_age", "end_age", "ongoing", "mode", "loss_of_control", "note", "observation_ids"],
        properties: {
          kind: { type: "string", enum: [...TRACK_KINDS] },
          label: { type: "string" },
          start: { type: ["string", "null"], description: "YYYY, YYYY-MM ou YYYY-MM-DD ; null si l'antécédent n'est daté que par l'âge" },
          end: { type: ["string", "null"] },
          start_age: AGE_SCHEMA,
          end_age: AGE_SCHEMA,
          ongoing: { type: "boolean" },
          // Anthropic rejects an enum under a union type; anyOf is accepted everywhere.
          mode: { anyOf: [{ type: "string", enum: [...USAGE_MODES] }, { type: "null" }] },
          loss_of_control: { type: "boolean" },
          note: { type: "string" },
          observation_ids: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

export const TIMELINE_SYSTEM = `Tu construis la frise chronologique d'un parcours de soins en addictologie (modèle Auriacombe et al., 2018) à partir d'observations cliniques pseudonymisées. Garde les étiquettes ([PATIENT], [SOIGNANT_2]…) telles quelles.

Pistes (kind) :
- substance_use : une piste par substance (label = « Alcool », « Cannabis », « Opioïdes »…). mode = usage, intoxication, sevrage, rechute ou craving. loss_of_control = true si une perte de contrôle est décrite.
- psychiatric : troubles et épisodes (label = trouble, ex. « Épisode dépressif »).
- somatic : problèmes somatiques (label = problème).
- medication : un traitement par piste (label = molécule ; start/end = début/arrêt).
- therapeutic_psycho : prises en charge (hospitalisation, CSAPA, psychothérapie, groupe…).
- life_event : événements de vie (rupture, incarcération, emploi, logement, deuil…).

Règles :
- Un événement = une période (start, end) ou un point (end = null, ongoing = false). ongoing = true si toujours en cours à la dernière observation.
- Dates : la précision réellement connue (YYYY, YYYY-MM ou YYYY-MM-DD) dans start et end ; start_age et end_age restent alors null. Une durée (« depuis 3 ans », « il y a 2 ans ») se date à partir de la date de l'observation.
- Antécédent daté par l'âge ou par une période de vie (« alcool depuis l'âge de 15 ans », « premiers joints à l'adolescence ») : start = null et start_age à la place ; end_age si la fin est elle aussi racontée par l'âge (sinon end_age = null). Ne calcule jamais l'année toi-même, même si l'année de naissance figure dans le texte : elle est calculée ensuite. Format de l'âge : un nombre (15), un intervalle [12, 17], ou une période : « enfance » (6–11 ans), « adolescence » (12–17 ans), « jeune adulte » (18–25 ans) ; « vers 20 ans » = [19, 21]. La note garde la formulation d'origine (« à 15 ans »).
- observation_ids : identifiants des observations sources (au moins un). N'invente rien qui ne soit pas écrit.
- note : courte, factuelle, en français.`;

export interface TimelineInput {
  observations: Observation[];
  pagesByDoc: Record<string, PageText[]>;
  manifests: Record<string, Manifest | undefined>;
  policy: CloudPolicy;
  onProgress?: (done: number, total: number) => void;
  fetchImpl?: typeof fetch;
  /** Patient's birth year, known locally (detections): turns ages into
   *  years after the model has answered. Never sent to the model. */
  birthYear?: number | null;
  /** Characters of observation text per call (default CHARS_PER_CALL). */
  charsPerCall?: number;
}

export interface RawEvent {
  kind: string;
  label: string;
  start: string | null;
  end: string | null;
  /** Antecedent told by age: anything `parseAge` reads (14, [12, 17], "adolescence"). */
  start_age?: unknown;
  end_age?: unknown;
  ongoing: boolean;
  mode: string | null;
  loss_of_control: boolean;
  note: string;
  observation_ids: string[];
  /** Set by the consensus (consensus.ts), never by the model. */
  consensus?: TimelineEvent["consensus"];
}

function observationText(o: Observation, shortId: string, pages: PageText[], repeated: Set<string>): string {
  const body = linesBetween(pages, o.start, o.end, repeated)
    .map((l) => l.text)
    .join("\n");
  return `### ${shortId} — ${o.date ?? "date inconnue"} — ${o.kind}${o.authorRole ? ` (${o.authorRole})` : ""}\n${body}`;
}

/** Observations as the model sees them: short ids, unique across documents, and their text. */
export interface PreparedObservations {
  /** Chronological order. */
  sorted: Observation[];
  /** "o1" -> app observation id. */
  realId: Map<string, string>;
  /** App observation id -> "o1". */
  shortId: Map<string, string>;
  /** App observation id -> the text sent for it. */
  text: Map<string, string>;
}

export function prepareObservations(input: Pick<TimelineInput, "observations" | "pagesByDoc">): PreparedObservations {
  const repeatedByDoc = Object.fromEntries(
    Object.entries(input.pagesByDoc).map(([doc, pages]) => [doc, repeatedLines(pages)]),
  );
  const sorted = [...input.observations].sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
  // The model sees short ids, unique across documents ("o1", "o2"…): given
  // "historique:o2" and a single document, it often answered "o2", and every
  // event was then dropped for want of a known source.
  const realId = new Map(sorted.map((o, i) => [`o${i + 1}`, o.id]));
  const shortId = new Map([...realId].map(([short, id]) => [id, short]));
  const text = new Map(
    sorted.map((o) => [o.id, observationText(o, shortId.get(o.id)!, input.pagesByDoc[o.doc] ?? [], repeatedByDoc[o.doc] ?? new Set())]),
  );
  return { sorted, realId, shortId, text };
}

/** Pack observations into calls of bounded size. */
export function packObservations(obs: Observation[], text: Map<string, string>, limit = CHARS_PER_CALL): { text: string; docs: Set<string> }[] {
  const batches: { text: string; docs: Set<string> }[] = [];
  for (const o of obs) {
    const t = text.get(o.id)!;
    const last = batches.at(-1);
    if (!last || last.text.length + t.length > limit) batches.push({ text: t, docs: new Set([o.doc]) });
    else {
      last.text += "\n\n" + t;
      last.docs.add(o.doc);
    }
  }
  return batches;
}

/** One reading of the observations by the model: raw events, sources as app ids, not yet assembled. */
export async function readEvents(input: TimelineInput, prepared = prepareObservations(input)): Promise<RawEvent[]> {
  const batches = packObservations(prepared.sorted, prepared.text, input.charsPerCall);
  const raw: RawEvent[] = [];
  let done = 0;
  for (const batch of batches) {
    const result = await chatJson<{ events: RawEvent[] }>({
      policy: input.policy,
      manifests: [...batch.docs].map((d) => input.manifests[d]),
      messages: [
        { role: "system", content: TIMELINE_SYSTEM },
        { role: "user", content: `Observations (ordre chronologique) :\n\n${batch.text}` },
      ],
      docs: [...batch.docs],
      schemaName: "frise",
      schema: TIMELINE_SCHEMA,
      fetchImpl: input.fetchImpl,
    });
    for (const e of result.events ?? []) {
      raw.push({ ...e, observation_ids: (e.observation_ids ?? []).map((id) => prepared.realId.get(id) ?? id) });
    }
    input.onProgress?.(++done, batches.length);
  }
  return raw;
}

/** Date of the last dated observation, the bound for ages. */
export function lastObservationDate(observations: Observation[]): string | null {
  return observations.map((o) => o.date).filter((d): d is string => Boolean(d)).sort().at(-1) ?? null;
}

export async function buildTimeline(input: TimelineInput): Promise<Timeline> {
  const raw = await readEvents(input);
  return assembleTimeline(raw, new Set(input.observations.map((o) => o.id)), input.birthYear ?? null, lastObservationDate(input.observations));
}

function normaliseLabel(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Validate raw events and group them into one track per (kind, label).
 *
 * Ages become years here: start_age [a, b] -> start = birthYear + a, and
 * end = birthYear + b when a < b and nothing else ends the event. An age
 * with no birth year, or resolving past `lastObservation` (the date of the
 * last dated observation; no bound when it is omitted), goes to `undated`.
 */
export function assembleTimeline(
  raw: RawEvent[],
  knownObservations: Set<string>,
  birthYear: number | null = null,
  lastObservation: string | null = null,
): Timeline {
  const tracks: Track[] = [];
  const trackOf = new Map<string, Track>();
  const events: TimelineEvent[] = [];
  const undated: UndatedEvent[] = [];
  const seen = new Map<string, { observationIds: string[] }>();
  const lastYear = lastObservation && isPartialDate(lastObservation) ? Number(lastObservation.slice(0, 4)) : null;
  /** Year of an age, or null when it cannot be placed on the axis. */
  const yearAt = (age: number): string | null => {
    if (birthYear === null) return null;
    const y = String(birthYear + age);
    if (!isPartialDate(y)) return null;
    return lastYear !== null && birthYear + age > lastYear ? null : y;
  };
  const trackFor = (kind: TrackKind, rawLabel: string): Track => {
    const label = rawLabel.trim() || "Autre";
    const key = `${kind}|${normaliseLabel(label)}`;
    let track = trackOf.get(key);
    if (!track) {
      track = { id: `t${tracks.length + 1}`, kind, label };
      tracks.push(track);
      trackOf.set(key, track);
    }
    return track;
  };
  /** Same event reported from two batches: keep one, union the sources. */
  const merged = (key: string, sources: string[]): boolean => {
    const existing = seen.get(key);
    if (!existing) return false;
    existing.observationIds.splice(0, Infinity, ...new Set([...existing.observationIds, ...sources]));
    return true;
  };

  for (const e of raw) {
    if (!(TRACK_KINDS as readonly string[]).includes(e.kind)) continue;
    const dated = isPartialDate(e.start);
    const startAge = dated ? null : parseAge(e.start_age);
    if (!dated && !startAge) continue; // neither a date nor a readable age
    const sources = (e.observation_ids ?? []).filter((id) => knownObservations.has(id));
    if (sources.length === 0) continue; // nothing on the frise without a source
    const kind = e.kind as TrackKind;
    const mode = kind === "substance_use" && (USAGE_MODES as readonly string[]).includes(e.mode ?? "") ? (e.mode as TimelineEvent["mode"]) : null;
    const endAge = parseAge(e.end_age);
    const common = {
      ongoing: Boolean(e.ongoing),
      mode,
      lossOfControl: Boolean(e.loss_of_control) && kind === "substance_use",
      note: (e.note ?? "").trim(),
      observationIds: sources,
      ...(e.consensus ? { consensus: e.consensus } : {}),
    };

    let start: string;
    let end: string | null = null;
    let fromAge: TimelineEvent["fromAge"];
    if (dated) {
      start = e.start as string;
      if (isPartialDate(e.end) && e.end >= start) end = e.end;
      else if (endAge) {
        const y = yearAt(endAge[1]);
        if (y !== null && y >= start.slice(0, 4)) {
          end = y;
          fromAge = { start: null, end: endAge };
        }
      }
    } else {
      const age = startAge!;
      const y = yearAt(age[0]);
      // An end told by age ends with its range: "jusqu'à l'adolescence" is 17.
      const endFromAge = endAge ? yearAt(endAge[1]) : undefined;
      if (y === null || endFromAge === null) {
        const track = trackFor(kind, e.label);
        const key = `${track.id}|${age}|${endAge}|${mode}`;
        if (merged(key, sources)) continue;
        const u: UndatedEvent = { id: `u${undated.length + 1}`, trackId: track.id, startAge: age, endAge, ...common };
        seen.set(key, u);
        undated.push(u);
        continue;
      }
      start = y;
      if (isPartialDate(e.end) && e.end >= start) end = e.end;
      else if (endFromAge && endFromAge >= start) end = endFromAge;
      else if (age[0] < age[1] && !e.ongoing) {
        // A period of life ("à l'adolescence"): the bar covers it, cut at the last observation.
        end = String(Math.min(birthYear! + age[1], lastYear ?? Infinity));
      }
      fromAge = { start: age, end: endFromAge ? endAge : null };
    }

    const track = trackFor(kind, e.label);
    const key = `${track.id}|${start}|${end}|${mode}`;
    if (merged(key, sources)) continue;
    const event: TimelineEvent = {
      id: `e${events.length + 1}`,
      trackId: track.id,
      start,
      end,
      ...common,
      ongoing: common.ongoing && !end,
      ...(fromAge ? { fromAge } : {}),
    };
    seen.set(key, event);
    events.push(event);
  }
  tracks.sort((a, b) => TRACK_KINDS.indexOf(a.kind) - TRACK_KINDS.indexOf(b.kind));
  return { tracks, events, undated };
}
