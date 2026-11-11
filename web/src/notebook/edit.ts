/**
 * Corrections made by hand on a frise: change, add, delete or merge events,
 * give a verdict, pick the landmarks of the short view. Pure functions: each
 * returns a new timeline. Everything is stored in the timeline itself, so a
 * saved analysis carries its corrections, and `carryCorrections` puts them
 * back on a frise read again from the same dossier.
 */
import { dateEnd, dateStart, isPartialDate, type Timeline, type TimelineEvent, type Track, type TrackKind, type UsageMode } from "./model";

const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** "2013", "05/2013", "12/05/2013" or the ISO forms -> "YYYY[-MM[-DD]]"; null if not a date. */
export function parseDateInput(raw: string): string | null {
  const s = raw.trim();
  const fr = /^(?:(\d{1,2})\/)?(\d{1,2})\/(\d{4})$/.exec(s);
  const iso = fr ? [fr[3], fr[2].padStart(2, "0"), ...(fr[1] ? [fr[1].padStart(2, "0")] : [])].join("-") : s;
  return isPartialDate(iso) ? iso : null;
}

/** The track of that kind and label, created if the frise has none. */
function withTrack(t: Timeline, kind: TrackKind, label: string): { tracks: Track[]; track: Track } {
  const clean = label.trim() || "Autre";
  const found = t.tracks.find((x) => x.kind === kind && fold(x.label) === fold(clean));
  if (found) return { tracks: t.tracks, track: found };
  const ids = new Set(t.tracks.map((x) => x.id));
  let n = t.tracks.length + 1;
  while (ids.has(`t${n}`)) n++;
  const track = { id: `t${n}`, kind, label: clean };
  return { tracks: [...t.tracks, track], track };
}

/** Tracks left without any event are dropped. */
function prune(t: Timeline): Timeline {
  const used = new Set([...t.events, ...t.undated].map((e) => e.trackId));
  return { ...t, tracks: t.tracks.filter((x) => used.has(x.id)) };
}

export interface EventDraft {
  kind: TrackKind;
  label: string;
  start: string;
  end: string | null;
  ongoing: boolean;
  mode: UsageMode | null;
  lossOfControl: boolean;
  note: string;
}

export function draftOf(t: Timeline, e: TimelineEvent): EventDraft {
  const track = t.tracks.find((x) => x.id === e.trackId)!;
  return { kind: track.kind, label: track.label, start: e.start, end: e.end, ongoing: e.ongoing, mode: e.mode, lossOfControl: e.lossOfControl, note: e.note };
}

/** Why a draft cannot be saved, or null. */
export function draftError(d: EventDraft): string | null {
  if (!isPartialDate(d.start)) return "Date de début : une année, un mois (05/2013) ou un jour (12/05/2013).";
  if (d.end !== null && !isPartialDate(d.end)) return "Date de fin : une année, un mois ou un jour, ou laisser vide.";
  if (d.end !== null && dateEnd(d.end) < dateStart(d.start)) return "La fin est avant le début.";
  if (!d.label.trim()) return "Donner un nom à la ligne (par exemple « Alcool »).";
  return null;
}

function fields(d: EventDraft): Pick<TimelineEvent, "start" | "end" | "ongoing" | "mode" | "lossOfControl" | "note"> {
  const substance = d.kind === "substance_use";
  return { start: d.start, end: d.ongoing ? null : d.end, ongoing: d.ongoing, mode: substance ? d.mode : null, lossOfControl: substance && d.lossOfControl, note: d.note.trim() };
}

export function updateEvent(t: Timeline, id: string, d: EventDraft): Timeline {
  const before = t.events.find((e) => e.id === id);
  if (!before || draftError(d)) return t;
  const { tracks, track } = withTrack(t, d.kind, d.label);
  const next: TimelineEvent = { ...before, ...fields(d), trackId: track.id, edited: before.edited ?? "changed" };
  // A date typed by hand is no longer computed from an age, nor unknown.
  if (next.start !== before.start || next.end !== before.end) {
    delete next.fromAge;
    delete next.startUnknown;
  }
  return prune({ ...t, tracks, events: t.events.map((e) => (e.id === id ? next : e)) });
}

export function addEvent(t: Timeline, d: EventDraft): Timeline {
  if (draftError(d)) return t;
  const { tracks, track } = withTrack(t, d.kind, d.label);
  const ids = new Set(t.events.map((e) => e.id));
  let n = t.events.length + 1;
  while (ids.has(`m${n}`)) n++;
  const event: TimelineEvent = { id: `m${n}`, trackId: track.id, ...fields(d), observationIds: [], edited: "added" };
  return { ...t, tracks, events: [...t.events, event] };
}

export function removeEvent(t: Timeline, id: string): Timeline {
  const e = t.events.find((x) => x.id === id);
  if (!e) return t;
  const track = t.tracks.find((x) => x.id === e.trackId)!;
  // An event added by hand leaves no trace; one read by the model is remembered.
  const removed = e.edited === "added" ? t.removed : [...(t.removed ?? []), { kind: track.kind, label: track.label, start: e.start }];
  return prune({ ...t, events: t.events.filter((x) => x.id !== id), ...(removed ? { removed } : {}) });
}

/** Merge `otherId` into `keepId`: the widest period, both notes, every source. */
export function mergeEvents(t: Timeline, keepId: string, otherId: string): Timeline {
  const a = t.events.find((e) => e.id === keepId);
  const b = t.events.find((e) => e.id === otherId);
  if (!a || !b || a === b) return t;
  const start = dateStart(b.start) < dateStart(a.start) ? b.start : a.start;
  const ends = [a, b].flatMap((e) => (e.end ? [e.end] : []));
  const ongoing = a.ongoing || b.ongoing;
  const end = ongoing || !ends.length ? null : ends.sort((x, y) => dateEnd(y) - dateEnd(x))[0];
  const note = a.note === b.note || !b.note ? a.note : !a.note ? b.note : `${a.note} · ${b.note}`;
  const merged: TimelineEvent = {
    ...a,
    start,
    end,
    ongoing,
    note,
    lossOfControl: a.lossOfControl || b.lossOfControl,
    observationIds: [...new Set([...a.observationIds, ...b.observationIds])],
    edited: a.edited ?? "changed",
  };
  if (start !== a.start) {
    delete merged.fromAge;
    delete merged.startUnknown;
  }
  return prune({ ...t, events: t.events.filter((e) => e.id !== otherId).map((e) => (e.id === keepId ? merged : e)) });
}

export function setVerdict(t: Timeline, id: string, verdict: TimelineEvent["verdict"]): Timeline {
  return { ...t, events: t.events.map((e) => (e.id === id ? withOptional(e, "verdict", verdict) : e)) };
}

export function setKey(t: Timeline, id: string, key: boolean | undefined): Timeline {
  return { ...t, events: t.events.map((e) => (e.id === id ? withOptional(e, "key", key) : e)) };
}

function withOptional<K extends "verdict" | "key">(e: TimelineEvent, k: K, v: TimelineEvent[K]): TimelineEvent {
  const next = { ...e };
  if (v === undefined) delete next[k];
  else next[k] = v;
  return next;
}

/** What was done by hand on this frise. */
export function correctionCount(t: Timeline): { edited: number; removed: number; verdicts: number; total: number } {
  const edited = t.events.filter((e) => e.edited).length;
  const removed = t.removed?.length ?? 0;
  // Checked: given a verdict, or corrected (which is a verdict too).
  const verdicts = t.events.filter((e) => e.verdict || e.edited).length;
  return { edited, removed, verdicts, total: edited + removed };
}

const identity = (t: Timeline, e: TimelineEvent) => {
  const track = t.tracks.find((x) => x.id === e.trackId)!;
  return `${track.kind}|${fold(track.label)}|${e.start}`;
};

/**
 * The corrections of `previous` put back on `fresh`, the same dossier read
 * again: deleted events stay deleted, events added or changed by hand come
 * back (in place of the one read at the same line and date, if any),
 * verdicts and landmarks follow the events found again.
 */
export function carryCorrections(previous: Timeline, fresh: Timeline): Timeline {
  const gone = new Set((previous.removed ?? []).map((r) => `${r.kind}|${fold(r.label)}|${r.start}`));
  let out: Timeline = { ...fresh, events: fresh.events.filter((e) => !gone.has(identity(fresh, e))) };
  const marks = new Map(previous.events.filter((e) => !e.edited && (e.verdict || e.key !== undefined)).map((e) => [identity(previous, e), e]));
  out = {
    ...out,
    events: out.events.map((e) => {
      const m = marks.get(identity(out, e));
      return m ? { ...e, ...(m.verdict ? { verdict: m.verdict } : {}), ...(m.key !== undefined ? { key: m.key } : {}) } : e;
    }),
  };
  for (const e of previous.events.filter((x) => x.edited)) {
    const track = previous.tracks.find((x) => x.id === e.trackId)!;
    const { tracks, track: mine } = withTrack(out, track.kind, track.label);
    const key = `${track.kind}|${fold(track.label)}|${e.start}`;
    const ids = new Set(out.events.map((x) => x.id));
    let id = e.id;
    for (let n = 1; ids.has(id); n++) id = `m${out.events.length + n}`;
    // The observation ids of another reading mean nothing here.
    const back: TimelineEvent = { ...e, id, trackId: mine.id, observationIds: [] };
    out = { ...out, tracks, events: [...out.events.filter((x) => identity(out, x) !== key), back] };
  }
  return prune({ ...out, ...(previous.removed ? { removed: previous.removed } : {}), ...(previous.missing ? { missing: previous.missing } : {}) });
}

const YEAR = 365.25 * 864e5;

/**
 * The landmarks of the short view: about `n` events chosen by simple rules
 * (first use of each substance or behaviour, loss of control, life events
 * before follow-up, first care, relapses, long periods), then what the
 * reader forced in or out. In chronological order.
 */
export function keyEvents(t: Timeline, followUpFrom: number | null, n = 10): TimelineEvent[] {
  const kindOf = new Map(t.tracks.map((x) => [x.id, x.kind]));
  const first = new Map<string, TimelineEvent>();
  for (const e of [...t.events].sort((a, b) => dateStart(a.start) - dateStart(b.start))) if (!first.has(e.trackId)) first.set(e.trackId, e);
  // The oldest care of all: where the course of care begins.
  const firstCare = [...first.values()].filter((e) => kindOf.get(e.trackId) === "therapeutic_psycho").sort((a, b) => dateStart(a.start) - dateStart(b.start))[0];
  const score = (e: TimelineEvent): number => {
    const kind = kindOf.get(e.trackId);
    const isFirst = first.get(e.trackId) === e;
    let s = 0;
    if (kind === "substance_use" && isFirst) s += 4;
    if (kind === "psychiatric" && isFirst) s += 2;
    if (kind === "therapeutic_psycho" && isFirst) s += 2;
    if (kind === "life_event") s += followUpFrom !== null && dateStart(e.start) < followUpFrom ? 3 : 2;
    if (e === firstCare) s += 3;
    if (e.lossOfControl) s += 3;
    if (e.mode === "rechute") s += 1;
    if (e.end && dateEnd(e.end) - dateStart(e.start) >= 2 * YEAR) s += 1;
    if (kind === "medication" || kind === "somatic") s -= 1;
    return s;
  };
  const free = t.events.filter((e) => e.key === undefined && e.verdict !== "wrong");
  const forced = t.events.filter((e) => e.key === true);
  const ranked = free
    .map((e) => ({ e, s: score(e) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || dateStart(a.e.start) - dateStart(b.e.start))
    .map((x) => x.e);
  // Neither part of the course takes everything: at most 60 % of the
  // landmarks from before follow-up, or from follow-up, when both have some.
  const room = Math.max(0, n - forced.length);
  const before = (e: TimelineEvent) => followUpFrom !== null && dateStart(e.start) < followUpFrom;
  const cap = Math.ceil(room * 0.6);
  const taken = { before: 0, after: 0 };
  const auto: TimelineEvent[] = [];
  const left: TimelineEvent[] = [];
  for (const e of ranked) {
    const side = before(e) ? "before" : "after";
    if (auto.length < room && taken[side] < cap) {
      auto.push(e);
      taken[side]++;
    } else left.push(e);
  }
  auto.push(...left.slice(0, room - auto.length));
  return [...forced, ...auto].sort((a, b) => dateStart(a.start) - dateStart(b.start));
}
