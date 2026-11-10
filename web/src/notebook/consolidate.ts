/**
 * Regroupement: a long dossier is read in independent lots, and the dossier
 * itself retells the past (intake, yearly syntheses, letters), so the same
 * fact comes back several times under labels and dates that vary. One more
 * call, without any observation text, shows the model the tracks and events
 * already found and asks which ones are the same thing. Code then merges:
 * the model never adds or removes an event, and nothing it answers is taken
 * without being checked against what was read.
 */
import { chatJson } from "../cloud/client";
import { CloudRefused } from "../cloud/guard";
import {
  dateEnd,
  dateStart,
  TRACK_KIND_LABEL,
  TRACK_KINDS,
  tellingsDisagree,
  type ConsolidationStats,
  type Observation,
  type Telling,
  type Timeline,
  type TimelineEvent,
  type Track,
} from "./model";
import type { TimelineInput } from "./timeline";

/** Characters of an event's note shown to the model. */
const NOTE_CHARS = 140;
/** Source dates shown per event. */
const SOURCES_SHOWN = 3;

export const CONSOLIDATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["tracks", "events"],
  properties: {
    tracks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "track_ids"],
        properties: { label: { type: "string" }, track_ids: { type: "array", items: { type: "string" } } },
      },
    },
    events: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["event_ids", "start", "end"],
        properties: {
          event_ids: { type: "array", items: { type: "string" } },
          start: { type: "string", description: "YYYY, YYYY-MM ou YYYY-MM-DD, recopié d'un événement du groupe" },
          end: { type: ["string", "null"] },
        },
      },
    },
  },
};

export const CONSOLIDATION_SYSTEM = `Tu regroupes les doublons d'une frise chronologique d'addictologie (modèle Auriacombe et al., 2018). La frise a été construite en lisant le dossier par lots indépendants : le même fait y revient plusieurs fois (raconté à l'entrée, repris dans une synthèse, un courrier, une observation plus tardive), sous des intitulés et avec des dates qui varient. Tu ne vois pas les observations, seulement les pistes et leurs événements. Tu ne crées rien et tu ne supprimes rien : tu dis seulement ce qui désigne la même chose.

Pistes (tracks) : regroupe les pistes d'une même rubrique qui désignent la même chose sous deux intitulés (« Accident de moto » et « Accident de la voie publique (moto) » ; « Suivi CSAPA » et « Prise en charge au CSAPA » ; « VHC » et « Hépatite C »). label = l'intitulé à garder, le plus clair. Ne regroupe pas deux substances, deux molécules, deux troubles ou deux prises en charge distincts : « Oxycodone » et « Tramadol » restent deux pistes, une hospitalisation et un suivi ambulatoire aussi.

Événements (events) : une fois les pistes regroupées, regroupe les événements qui racontent le même fait ou le même épisode.
- Même fait raconté plusieurs fois, avec une date plus ou moins précise (« 2014 », « 2014-10 », « 2014-10-14 ») ou contradictoire d'une observation à l'autre (« 2013 » selon le patient, « 2014-10-14 » dans un courrier).
- Même épisode raconté en morceaux : son début dans une observation (« en cours »), sa fin dans une autre (arrêt, sortie, fin de contrat…).
- start = le début à garder, recopié de l'un des événements du groupe : le plus précis s'ils sont compatibles, le mieux documenté s'ils se contredisent. Un « début non précisé » ne vaut pas un début raconté. end = la fin de l'épisode, recopiée d'un début ou d'une fin du groupe ; null si aucune fin n'est connue.
- Ne regroupe jamais deux épisodes distincts : deux hospitalisations, deux rechutes, deux sevrages, deux incarcérations à des dates différentes restent séparés. Les paliers de dose successifs d'un traitement restent séparés. Deux modes différents (usage, sevrage, rechute, craving, intoxication) ne se regroupent pas.
- Dans le doute, ne regroupe pas.

Ne cite que les groupes d'au moins deux éléments ; une piste ou un événement ne figure que dans un seul groupe. Reprends les identifiants tels quels (t12, e87).`;

export interface ConsolidationAnswer {
  tracks: { label: string; track_ids: string[] }[];
  events: { event_ids: string[]; start: string; end: string | null }[];
}

const datesOf = (observations: Observation[]) => new Map(observations.map((o) => [o.id, o.date ?? ""]));

/** The tracks and events as the model sees them: no observation text. */
export function consolidationMessage(timeline: Timeline, observations: Observation[], lots: number): string {
  const date = datesOf(observations);
  const last = [...date.values()].sort().at(-1) || "inconnue";
  const lines = [
    `Frise lue en ${lots} lots : ${timeline.tracks.length} pistes, ${timeline.events.length} événements. Dernière observation du dossier : ${last}.`,
  ];
  for (const kind of TRACK_KINDS) {
    const tracks = timeline.tracks.filter((t) => t.kind === kind);
    if (!tracks.length) continue;
    lines.push("", `## ${TRACK_KIND_LABEL[kind]}`);
    for (const track of tracks) {
      lines.push("", `### ${track.id} — ${track.label}`);
      for (const e of timeline.events.filter((x) => x.trackId === track.id)) {
        const seen = [...new Set(e.observationIds.map((id) => date.get(id) ?? "").filter(Boolean))].sort();
        const shown = seen.slice(0, SOURCES_SHOWN).join(", ") + (seen.length > SOURCES_SHOWN ? ` (+${seen.length - SOURCES_SHOWN})` : "");
        const start = e.startUnknown ? `${e.start} (début non précisé)` : e.fromAge?.start ? `${e.start} (d'après l'âge)` : e.start;
        const span = e.end ? `${start} → ${e.end}` : e.ongoing ? `${start} → en cours au ${seen.at(-1) ?? "?"}` : start;
        const note = e.note.length > NOTE_CHARS ? `${e.note.slice(0, NOTE_CHARS)}…` : e.note;
        lines.push(`- ${[e.id, span, e.mode, note, `vu le ${shown || "?"}`].filter(Boolean).join(" | ")}`);
      }
    }
  }
  return lines.join("\n");
}

/** `end` does not fall before `start`, whatever their precisions. */
const notBefore = (end: string, start: string) => dateEnd(end) >= dateStart(start);

const tellingsOf = (e: TimelineEvent): Telling[] =>
  e.tellings ?? [{ start: e.startUnknown ? null : e.start, end: e.end, note: e.note, observationIds: e.observationIds }];

/**
 * Merge what the model says is the same thing, after checking it: unknown
 * ids, a second mention of an id, tracks of two kinds, events of two tracks
 * or two modes are left as they were; a label, a start or an end the group
 * does not hold is replaced by one it holds.
 */
export function applyConsolidation(timeline: Timeline, answer: ConsolidationAnswer, observations: Observation[], lots = 2): Timeline {
  const date = datesOf(observations);
  const order = new Map([...date].sort((a, b) => (a[1] || "9999").localeCompare(b[1] || "9999")).map(([id], i) => [id, i]));
  const lastSeen = (ids: string[]) => ids.map((id) => date.get(id) ?? "").sort().at(-1) ?? "";

  // --- Tracks: same kind only, each track in one group at most.
  const trackById = new Map(timeline.tracks.map((t) => [t.id, t]));
  const into = new Map<string, string>();
  const relabelled = new Map<string, Pick<Track, "label" | "aliases">>();
  const usedTracks = new Set<string>();
  for (const g of Array.isArray(answer?.tracks) ? answer.tracks : []) {
    const ids = [...new Set(Array.isArray(g?.track_ids) ? g.track_ids : [])].filter((id) => trackById.has(id) && !usedTracks.has(id));
    const members = timeline.tracks.filter((t) => ids.includes(t.id) && t.kind === trackById.get(ids[0])!.kind);
    if (members.length < 2) continue;
    for (const t of members) {
      usedTracks.add(t.id);
      into.set(t.id, members[0].id);
    }
    // The label kept is one that was read: the model's if it copied one of the
    // group's, otherwise that of the track holding the most events.
    const same = (a: string, b: string) => a.trim().toLocaleLowerCase("fr") === b.trim().toLocaleLowerCase("fr");
    const size = (t: Track) => timeline.events.filter((e) => e.trackId === t.id).length;
    const named = members.find((t) => typeof g.label === "string" && same(t.label, g.label));
    const kept = named ?? members.reduce((best, t) => (size(t) > size(best) ? t : best));
    // The labels not kept stay on the track: nothing that was read is lost.
    const others = members.flatMap((t) => [t.label, ...(t.aliases ?? [])]).filter((l) => !same(l, kept.label));
    const aliases = others.filter((l, i) => others.findIndex((o) => same(o, l)) === i);
    relabelled.set(members[0].id, { label: kept.label, ...(aliases.length ? { aliases } : {}) });
  }
  const tracks: Track[] = timeline.tracks
    .filter((t) => (into.get(t.id) ?? t.id) === t.id)
    .map((t) => (relabelled.has(t.id) ? { id: t.id, kind: t.kind, ...relabelled.get(t.id)! } : t));
  const moved = <T extends { trackId: string }>(e: T): T => (into.has(e.trackId) ? { ...e, trackId: into.get(e.trackId)! } : e);

  // --- Events: one group = one track and one mode.
  const merge = (members: TimelineEvent[], proposal?: { start?: unknown; end?: unknown }): TimelineEvent => {
    // A start that was told beats the date of a first mention.
    const told = members.filter((m) => !m.startUnknown);
    const pool = told.length ? told : members;
    const count = (s: string) => pool.filter((m) => m.start === s).length;
    const chosen =
      pool.find((m) => m.start === proposal?.start) ??
      [...pool].sort((a, b) => b.start.length - a.start.length || count(b.start) - count(a.start))[0];
    const start = chosen.start;
    // The end of the episode: an end of the group, or the start of the mention that closes it.
    const ends = members.flatMap((m) => [m.end, ...(m.startUnknown ? [] : [m.start])]).filter((d): d is string => Boolean(d) && d !== start && notBefore(d!, start));
    const ownEnds = members.flatMap((m) => (m.end && notBefore(m.end, start) ? [m.end] : [])).sort((a, b) => dateEnd(a) - dateEnd(b));
    const end = typeof proposal?.end === "string" && ends.includes(proposal.end) ? proposal.end : (ownEnds.at(-1) ?? null);
    const latest = members.map((m) => lastSeen(m.observationIds)).sort().at(-1);
    // A bound taken from another telling is no longer the one worked out from an age.
    const { fromAge, ...kept } = chosen;
    const age = fromAge && { start: fromAge.start, end: end === chosen.end ? fromAge.end : null };
    return {
      ...kept,
      ...(age && (age.start || age.end) ? { fromAge: age } : {}),
      id: members[0].id,
      start,
      end,
      ongoing: !end && members.some((m) => m.ongoing && lastSeen(m.observationIds) === latest),
      lossOfControl: members.some((m) => m.lossOfControl),
      observationIds: [...new Set(members.flatMap((m) => m.observationIds))].sort((a, b) => (order.get(a) ?? Infinity) - (order.get(b) ?? Infinity)),
      tellings: members.flatMap(tellingsOf),
    };
  };

  const moves = timeline.events.map(moved);
  const byId = new Map(moves.map((e) => [e.id, e]));
  const groupOf = new Map<string, { members: TimelineEvent[]; proposal?: { start?: unknown; end?: unknown } }>();
  for (const g of Array.isArray(answer?.events) ? answer.events : []) {
    const ids = new Set((Array.isArray(g?.event_ids) ? g.event_ids : []).filter((id) => byId.has(id) && !groupOf.has(id)));
    const parts = new Map<string, TimelineEvent[]>();
    for (const e of moves) if (ids.has(e.id)) parts.set(`${e.trackId}|${e.mode}`, [...(parts.get(`${e.trackId}|${e.mode}`) ?? []), e]);
    for (const members of parts.values()) {
      if (members.length < 2) continue;
      const group = { members, proposal: { start: g.start, end: g.end } };
      for (const m of members) groupOf.set(m.id, group);
    }
  }
  const events: TimelineEvent[] = [];
  const seen = new Map<string, number>();
  for (const e of moves) {
    const group = groupOf.get(e.id);
    if (group && group.members[0].id !== e.id) continue; // merged into the first of its group
    const event = group ? merge(group.members, group.proposal) : e;
    // Two tracks made one can leave the same event twice, as two lots do.
    const key = `${event.trackId}|${event.start}|${event.end}|${event.mode}`;
    const at = seen.get(key);
    if (at === undefined) {
      seen.set(key, events.length);
      events.push(event);
    } else events[at] = merge([events[at], event]);
  }

  const consolidation: ConsolidationStats = {
    lots,
    tracksBefore: timeline.tracks.length,
    tracksAfter: tracks.length,
    eventsBefore: timeline.events.length,
    eventsAfter: events.length,
    discordant: events.filter((e) => tellingsDisagree(e.tellings)).length,
  };
  return { ...timeline, tracks, events, undated: timeline.undated.map(moved), consolidation };
}

/**
 * Ask the model which tracks and events of a frise read in several lots are
 * the same thing, and merge them. A failed call (network, model, unreadable
 * answer) leaves the frise as read and says so (`consolidation.failed`); the
 * guard's refusal is not caught.
 */
export async function consolidateTimeline(
  timeline: Timeline,
  input: Pick<TimelineInput, "observations" | "manifests" | "policy" | "fetchImpl">,
  lots: number,
): Promise<Timeline> {
  const docs = [...new Set(input.observations.map((o) => o.doc))];
  const unchanged = (failed: string): Timeline => ({
    ...timeline,
    consolidation: {
      lots,
      tracksBefore: timeline.tracks.length,
      tracksAfter: timeline.tracks.length,
      eventsBefore: timeline.events.length,
      eventsAfter: timeline.events.length,
      discordant: 0,
      failed,
    },
  });
  let answer: ConsolidationAnswer;
  try {
    answer = await chatJson<ConsolidationAnswer>({
      policy: input.policy,
      // Labels and notes come from these documents: the same guard as for their text.
      manifests: docs.map((d) => input.manifests[d]),
      messages: [
        { role: "system", content: CONSOLIDATION_SYSTEM },
        { role: "user", content: consolidationMessage(timeline, input.observations, lots) },
      ],
      docs,
      schemaName: "regroupement",
      schema: CONSOLIDATION_SCHEMA,
      fetchImpl: input.fetchImpl,
    });
  } catch (err) {
    // Refused by the guard: nothing may be sent, as for any other call.
    if (err instanceof CloudRefused) throw err;
    return unchanged(String((err as Error)?.message ?? err));
  }
  return applyConsolidation(timeline, answer, input.observations, lots);
}
