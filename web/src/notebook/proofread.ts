/**
 * Second pass on a frise: the model reads the whole text again next to the
 * events and says which are wrong, which need a date, an end or a note
 * corrected, and what is missing (SPEC.md, « Relecture de la frise »).
 *
 * A frise read in lots carries errors no lot can see: a treatment left "en
 * cours" although it stops ten notes later, an antecedent placed at the date
 * of the note that tells it, a drug only asked for noted as taken. The answer
 * is applied on this machine: a correction that is not a date is left out, an
 * unknown number is ignored, and what is added goes through the same
 * validation as any event.
 */
import { chatJson } from "../cloud/client";
import { CloudRefused } from "../cloud/guard";
import { dateStart, isPartialDate, type Observation, type Timeline } from "./model";
import {
  assembleTimeline,
  lastObservationDate,
  observationDates,
  observationShortIds,
  prepareObservations,
  TIMELINE_SCHEMA,
  type RawEvent,
  type TimelineInput,
} from "./timeline";

export interface Verdict {
  /** "e3": the number the event has in the list given to the model. */
  id: string;
  verdict: "fix" | "wrong";
  /** null: unchanged. */
  start: string | null;
  /** null: no end. */
  end: string | null;
  ongoing: boolean;
  /** "": unchanged. */
  note: string;
  reason: string;
}

export interface ProofreadingAnswer {
  verdicts: Verdict[];
  missing: RawEvent[];
}

export const PROOFREAD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verdicts", "missing"],
  properties: {
    verdicts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "verdict", "start", "end", "ongoing", "note", "reason"],
        properties: {
          id: { type: "string", description: "numéro de l'événement : e1, e2…" },
          verdict: { type: "string", enum: ["fix", "wrong"] },
          start: { type: ["string", "null"], description: "début juste ; null si inchangé" },
          end: { type: ["string", "null"], description: "fin juste ; null s'il n'y en a pas" },
          ongoing: { type: "boolean", description: "en cours à la dernière observation" },
          note: { type: "string", description: "note juste ; chaîne vide si inchangée" },
          reason: { type: "string", description: "ce que dit le texte, en une phrase" },
        },
      },
    },
    missing: TIMELINE_SCHEMA.properties.events,
  },
};

export const PROOFREAD_SYSTEM = `Tu relis une frise chronologique d'addictologie (modèle Auriacombe et al., 2018) contre le texte des observations dont elle a été tirée. La frise a été construite en lisant le dossier par morceaux : vérifie chaque événement contre tout le texte. Garde les étiquettes ([PATIENT], [SOIGNANT_2]…) telles quelles.

Ne signale que ce que le texte contredit ; un événement juste ne figure pas dans ta réponse.
- verdict = "wrong" : le fait n'existe pas dans le texte. Exemples : un médicament seulement demandé par le patient ou envisagé par l'équipe, jamais prescrit ; un fait qui concerne un proche ; un fait nié.
- verdict = "fix" : le fait existe mais sa date, sa fin ou sa note est à reprendre. Cherche surtout : un événement noté en cours alors qu'il s'arrête plus loin dans le dossier, ou noté terminé alors qu'il se poursuit ; un antécédent placé à la date de l'observation qui le raconte alors que le texte permet de le dater plus tôt ; une date de fin prise pour un début (« jusqu'en », « sorti le ») ; une durée mal comptée ; une note qui dit autre chose que le texte. Donne start, end, ongoing et note tels qu'ils doivent être (start = null et note = "" s'ils ne changent pas).
- missing : les événements importants du parcours que la frise n'a pas (tentative de suicide, hospitalisation, traitement, début ou arrêt d'un usage, événement de vie marquant, antécédent raconté en passant), avec les mêmes champs et les mêmes règles que la frise, et leurs observations sources.
- reason : ce que dit le texte, en une phrase courte. N'invente rien.`;

const period = (e: { start: string; end: string | null; ongoing: boolean }) => `${e.start}${e.ongoing ? " → en cours" : e.end ? ` → ${e.end}` : ""}`;

/** The numbered events, then the whole text, as the reviewer reads them. `text`: app observation id -> text sent. */
export function proofreadMessage(timeline: Timeline, observations: Observation[], text: Map<string, string>): string {
  const { sorted, shortId } = observationShortIds(observations);
  const track = new Map(timeline.tracks.map((t) => [t.id, t]));
  const events = timeline.events
    .map((e, i) => {
      const t = track.get(e.trackId)!;
      const flags = [e.mode, e.lossOfControl ? "perte de contrôle" : null].filter(Boolean).join(", ");
      return `e${i + 1} | ${t.kind} / ${t.label} | ${period(e)} | ${e.note}${flags ? ` (${flags})` : ""} | ${e.observationIds.map((id) => shortId.get(id) ?? id).join(", ")}`;
    })
    .join("\n");
  const last = lastObservationDate(observations);
  return `Frise à relire (numéro | piste | période | note | observations sources)${last ? `, dernière observation le ${last}` : ""} :\n\n${events}\n\nObservations (ordre chronologique) :\n\n${sorted.map((o) => text.get(o.id) ?? "").join("\n\n")}`;
}

const sameLabel = (a: string, b: string) => a.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim() === b.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

/** The frise with the reviewer's answer applied; the frise given is left as it was. */
export function applyProofreading(timeline: Timeline, answer: ProofreadingAnswer, observations: Observation[], birthYear: number | null = null): Timeline {
  const byNumber = new Map(timeline.events.map((e, i) => [`e${i + 1}`, e.id]));
  const verdictOf = new Map<string, Verdict>();
  for (const v of answer.verdicts ?? []) {
    const id = byNumber.get(v.id);
    if (id && !verdictOf.has(id)) verdictOf.set(id, v);
  }
  let fixed = 0;
  let removed = 0;
  let events = timeline.events.flatMap((e) => {
    const v = verdictOf.get(e.id);
    if (!v) return [e];
    if (v.verdict === "wrong") {
      removed++;
      return [];
    }
    const start = isPartialDate(v.start) ? v.start : e.start;
    // An end before the start is not an end: the event keeps the one it had.
    const ended = isPartialDate(v.end) && dateStart(v.end) >= dateStart(start.slice(0, v.end.length));
    const next = {
      ...e,
      start,
      end: ended ? v.end : v.ongoing ? null : e.end,
      ongoing: ended ? false : Boolean(v.ongoing),
      note: v.note?.trim() || e.note,
    };
    if (next.start !== e.start || next.end !== e.end || next.ongoing !== e.ongoing || next.note !== e.note) fixed++;
    return [next];
  });

  // What is missing is validated and placed like any event read, then joined to the lines that exist.
  const { realId } = observationShortIds(observations);
  const dates = observationDates(observations);
  const extra = assembleTimeline(
    (answer.missing ?? []).map((e) => ({ ...e, observation_ids: (e.observation_ids ?? []).map((id) => realId.get(id) ?? id) })),
    new Set(dates.keys()),
    birthYear,
    lastObservationDate(observations),
    dates,
  );
  const tracks = [...timeline.tracks];
  const taken = new Set([...tracks.map((t) => t.id), ...events.map((e) => e.id), ...timeline.undated.map((e) => e.id)]);
  const fresh = (prefix: string) => {
    let n = taken.size + 1;
    while (taken.has(`${prefix}${n}`)) n++;
    taken.add(`${prefix}${n}`);
    return `${prefix}${n}`;
  };
  const trackFor = new Map<string, string>();
  for (const t of extra.tracks) {
    const known = tracks.find((k) => k.kind === t.kind && sameLabel(k.label, t.label));
    if (known) trackFor.set(t.id, known.id);
    else {
      const id = fresh("t");
      tracks.push({ ...t, id });
      trackFor.set(t.id, id);
    }
  }
  events = [...events, ...extra.events.map((e) => ({ ...e, id: fresh("r"), trackId: trackFor.get(e.trackId)! }))];
  const undated = [...timeline.undated, ...extra.undated.map((e) => ({ ...e, id: fresh("r"), trackId: trackFor.get(e.trackId)! }))];
  const used = new Set([...events, ...undated].map((e) => e.trackId));
  return {
    ...timeline,
    tracks: tracks.filter((t) => used.has(t.id)),
    events,
    undated,
    proofreading: { checked: timeline.events.length, fixed, removed, added: extra.events.length + extra.undated.length },
  };
}

/** Ask the reviewer and apply its answer; a failed call leaves the frise as it was, and says so. */
export async function proofreadTimeline(
  timeline: Timeline,
  input: Pick<TimelineInput, "observations" | "pagesByDoc" | "manifests" | "policy" | "fetchImpl" | "birthYear">,
): Promise<Timeline> {
  const docs = [...new Set(input.observations.map((o) => o.doc))];
  let answer: ProofreadingAnswer;
  try {
    answer = await chatJson<ProofreadingAnswer>({
      policy: input.policy,
      manifests: docs.map((d) => input.manifests[d]),
      messages: [
        { role: "system", content: PROOFREAD_SYSTEM },
        { role: "user", content: proofreadMessage(timeline, input.observations, prepareObservations(input).text) },
      ],
      docs,
      schemaName: "relecture",
      schema: PROOFREAD_SCHEMA,
      fetchImpl: input.fetchImpl,
    });
  } catch (err) {
    if (err instanceof CloudRefused) throw err;
    return { ...timeline, proofreading: { checked: timeline.events.length, fixed: 0, removed: 0, added: 0, failed: String((err as Error)?.message ?? err) } };
  }
  return applyProofreading(timeline, answer, input.observations, input.birthYear ?? null);
}
