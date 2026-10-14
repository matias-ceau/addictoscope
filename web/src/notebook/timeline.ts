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
import {
  isPartialDate,
  TRACK_KINDS,
  USAGE_MODES,
  type Observation,
  type Timeline,
  type TimelineEvent,
  type Track,
  type TrackKind,
} from "./model";

/** Characters of observation text per call. */
export const CHARS_PER_CALL = 24_000;

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
        required: ["kind", "label", "start", "end", "ongoing", "mode", "loss_of_control", "note", "observation_ids"],
        properties: {
          kind: { type: "string", enum: [...TRACK_KINDS] },
          label: { type: "string" },
          start: { type: "string", description: "YYYY, YYYY-MM ou YYYY-MM-DD" },
          end: { type: ["string", "null"] },
          ongoing: { type: "boolean" },
          mode: { type: ["string", "null"], enum: [...USAGE_MODES, null] },
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
- Dates : la précision réellement connue (YYYY, YYYY-MM ou YYYY-MM-DD). Une date d'antécédent racontée (« alcool depuis l'âge de 15 ans ») se convertit seulement si l'année est calculable ; sinon ignore l'événement.
- observation_ids : identifiants des observations sources (au moins un). N'invente rien qui ne soit pas écrit.
- note : courte, factuelle, en français.`;

export interface TimelineInput {
  observations: Observation[];
  pagesByDoc: Record<string, PageText[]>;
  manifests: Record<string, Manifest | undefined>;
  policy: CloudPolicy;
  onProgress?: (done: number, total: number) => void;
  fetchImpl?: typeof fetch;
}

interface RawEvent {
  kind: string;
  label: string;
  start: string;
  end: string | null;
  ongoing: boolean;
  mode: string | null;
  loss_of_control: boolean;
  note: string;
  observation_ids: string[];
}

function observationText(o: Observation, pages: PageText[], repeated: Set<string>): string {
  const body = linesBetween(pages, o.start, o.end, repeated)
    .map((l) => l.text)
    .join("\n");
  return `### ${o.id} — ${o.date ?? "date inconnue"} — ${o.kind}${o.authorRole ? ` (${o.authorRole})` : ""}\n${body}`;
}

export async function buildTimeline(input: TimelineInput): Promise<Timeline> {
  const repeatedByDoc = Object.fromEntries(
    Object.entries(input.pagesByDoc).map(([doc, pages]) => [doc, repeatedLines(pages)]),
  );
  const sorted = [...input.observations].sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));

  // Pack observations into calls of bounded size.
  const batches: { text: string; docs: Set<string> }[] = [];
  for (const o of sorted) {
    const text = observationText(o, input.pagesByDoc[o.doc] ?? [], repeatedByDoc[o.doc] ?? new Set());
    const last = batches.at(-1);
    if (!last || last.text.length + text.length > CHARS_PER_CALL) batches.push({ text, docs: new Set([o.doc]) });
    else {
      last.text += "\n\n" + text;
      last.docs.add(o.doc);
    }
  }

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
      schemaName: "frise",
      schema: TIMELINE_SCHEMA,
      fetchImpl: input.fetchImpl,
    });
    raw.push(...(result.events ?? []));
    input.onProgress?.(++done, batches.length);
  }
  return assembleTimeline(raw, new Set(input.observations.map((o) => o.id)));
}

function normaliseLabel(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Validate raw events and group them into one track per (kind, label). */
export function assembleTimeline(raw: RawEvent[], knownObservations: Set<string>): Timeline {
  const tracks: Track[] = [];
  const trackOf = new Map<string, Track>();
  const events: TimelineEvent[] = [];
  const seen = new Set<string>();

  for (const e of raw) {
    if (!(TRACK_KINDS as readonly string[]).includes(e.kind)) continue;
    if (!isPartialDate(e.start)) continue;
    const sources = (e.observation_ids ?? []).filter((id) => knownObservations.has(id));
    if (sources.length === 0) continue; // nothing on the frise without a source
    const kind = e.kind as TrackKind;
    const label = e.label.trim() || "Autre";
    const key = `${kind}|${normaliseLabel(label)}`;
    let track = trackOf.get(key);
    if (!track) {
      track = { id: `t${tracks.length + 1}`, kind, label };
      tracks.push(track);
      trackOf.set(key, track);
    }
    const end = e.end && isPartialDate(e.end) && e.end >= e.start ? e.end : null;
    const mode = kind === "substance_use" && (USAGE_MODES as readonly string[]).includes(e.mode ?? "") ? (e.mode as TimelineEvent["mode"]) : null;
    const dedupe = `${track.id}|${e.start}|${end}|${mode}`;
    if (seen.has(dedupe)) {
      // Same event reported from two batches: keep one, union the sources.
      const existing = events.find((x) => `${x.trackId}|${x.start}|${x.end}|${x.mode}` === dedupe)!;
      existing.observationIds = [...new Set([...existing.observationIds, ...sources])];
      continue;
    }
    seen.add(dedupe);
    events.push({
      id: `e${events.length + 1}`,
      trackId: track.id,
      start: e.start,
      end,
      ongoing: Boolean(e.ongoing) && !end,
      mode,
      lossOfControl: Boolean(e.loss_of_control) && kind === "substance_use",
      note: e.note.trim(),
      observationIds: sources,
    });
  }
  tracks.sort((a, b) => TRACK_KINDS.indexOf(a.kind) - TRACK_KINDS.indexOf(b.kind));
  return { tracks, events };
}
