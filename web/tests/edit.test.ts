import { describe, expect, it } from "vitest";

import { addEvent, carryCorrections, correctionCount, draftOf, keyEvents, mergeEvents, parseDateInput, removeEvent, setKey, setVerdict, updateEvent } from "../src/notebook/edit";
import { dossierKey, restoreCorrections, storeCorrections } from "../src/app/corrections-store";
import { dateStart, type Observation, type Timeline, type TimelineEvent } from "../src/notebook/model";
import { historyShare, splitScale, ticks } from "../src/ui/axis";

const ev = (id: string, trackId: string, start: string, more: Partial<TimelineEvent> = {}): TimelineEvent => ({
  id,
  trackId,
  start,
  end: null,
  ongoing: false,
  mode: null,
  lossOfControl: false,
  note: "",
  observationIds: ["o1"],
  ...more,
});

const frise = (): Timeline => ({
  tracks: [
    { id: "t1", kind: "substance_use", label: "Alcool" },
    { id: "t2", kind: "life_event", label: "Séparation des parents" },
    { id: "t3", kind: "therapeutic_psycho", label: "CSAPA" },
  ],
  events: [
    ev("e1", "t1", "2003", { end: "2013", mode: "usage", note: "le week-end" }),
    ev("e2", "t1", "2013", { mode: "usage", lossOfControl: true, note: "quotidien" }),
    ev("e3", "t2", "1998"),
    ev("e4", "t3", "2023-09", { ongoing: true }),
  ],
  undated: [],
});

describe("dates typed by hand", () => {
  it("reads French and ISO forms, at the precision given", () => {
    expect(parseDateInput("2013")).toBe("2013");
    expect(parseDateInput("5/2013")).toBe("2013-05");
    expect(parseDateInput("12/05/2013")).toBe("2013-05-12");
    expect(parseDateInput(" 2013-05 ")).toBe("2013-05");
    expect(parseDateInput("mai 2013")).toBeNull();
    expect(parseDateInput("13/2013")).toBeNull();
  });
});

describe("corrections by hand", () => {
  it("changes an event, marks it, and forgets a date computed from an age", () => {
    const t = frise();
    t.events[2].fromAge = { start: [14, 14], end: null };
    const out = updateEvent(t, "e3", { ...draftOf(t, t.events[2]), start: "1999", note: "divorce" });
    const e = out.events.find((x) => x.id === "e3")!;
    expect(e).toMatchObject({ start: "1999", note: "divorce", edited: "changed" });
    expect(e.fromAge).toBeUndefined();
    expect(t.events[2].start).toBe("1998"); // the original is untouched
  });

  it("keeps a computed date when only the note changes", () => {
    const t = frise();
    t.events[2].fromAge = { start: [14, 14], end: null };
    const out = updateEvent(t, "e3", { ...draftOf(t, t.events[2]), note: "précision" });
    expect(out.events.find((x) => x.id === "e3")!.fromAge).toBeDefined();
  });

  it("moves an event to another line, creating it and dropping the emptied one", () => {
    const t = frise();
    const out = updateEvent(t, "e3", { ...draftOf(t, t.events[2]), label: "Divorce des parents" });
    expect(out.tracks.map((x) => x.label)).toEqual(["Alcool", "CSAPA", "Divorce des parents"]);
    expect(new Set(out.tracks.map((x) => x.id)).size).toBe(3);
  });

  it("refuses an end before the start", () => {
    const t = frise();
    expect(updateEvent(t, "e1", { ...draftOf(t, t.events[0]), end: "2001" })).toBe(t);
  });

  it("adds an event on an existing line whatever the accents and case", () => {
    const out = addEvent(frise(), { kind: "substance_use", label: "alcool", start: "2006", end: null, ongoing: false, mode: "usage", lossOfControl: true, note: "boit seul" });
    expect(out.tracks).toHaveLength(3);
    expect(out.events.at(-1)).toMatchObject({ trackId: "t1", edited: "added", observationIds: [], lossOfControl: true });
  });

  it("never keeps a mode or a loss of control outside uses", () => {
    const out = addEvent(frise(), { kind: "life_event", label: "Armée", start: "2003", end: "2013", ongoing: false, mode: "usage", lossOfControl: true, note: "" });
    expect(out.events.at(-1)).toMatchObject({ mode: null, lossOfControl: false });
  });

  it("deletes an event and remembers it, unless it was added by hand", () => {
    const out = removeEvent(frise(), "e3");
    expect(out.events).toHaveLength(3);
    expect(out.tracks.map((x) => x.id)).toEqual(["t1", "t3"]);
    expect(out.removed).toEqual([{ kind: "life_event", label: "Séparation des parents", start: "1998" }]);
    const added = addEvent(frise(), { kind: "somatic", label: "Fracture", start: "2015", end: null, ongoing: false, mode: null, lossOfControl: false, note: "" });
    expect(removeEvent(added, added.events.at(-1)!.id).removed).toBeUndefined();
  });

  it("merges two events into the widest period with both notes and sources", () => {
    const t = frise();
    t.events[1].observationIds = ["o2"];
    const out = mergeEvents(t, "e2", "e1");
    expect(out.events).toHaveLength(3);
    expect(out.events.find((e) => e.id === "e2")).toMatchObject({ start: "2003", end: "2013", note: "quotidien · le week-end", lossOfControl: true, observationIds: ["o2", "o1"], edited: "changed" });
  });

  it("counts what was done", () => {
    let t = removeEvent(frise(), "e3");
    t = setVerdict(t, "e1", "ok");
    t = updateEvent(t, "e2", { ...draftOf(t, t.events.find((e) => e.id === "e2")!), note: "tous les jours" });
    expect(correctionCount(t)).toEqual({ edited: 1, removed: 1, verdicts: 2, total: 2 });
    expect(setVerdict(t, "e1", undefined).events.find((e) => e.id === "e1")).not.toHaveProperty("verdict");
  });
});

describe("the same dossier read again", () => {
  it("keeps deletions, hand-made events, verdicts and landmarks", () => {
    let mine = removeEvent(frise(), "e4");
    mine = updateEvent(mine, "e2", { ...draftOf(mine, mine.events.find((e) => e.id === "e2")!), note: "corrigé" });
    mine = addEvent(mine, { kind: "life_event", label: "Armée", start: "2003", end: "2013", ongoing: false, mode: null, lossOfControl: false, note: "" });
    mine = setKey(setVerdict(mine, "e1", "ok"), "e1", true);
    mine = { ...mine, missing: "une hospitalisation en 2021" };

    const fresh = frise(); // the model reads the same four events, and one more
    fresh.tracks.push({ id: "t4", kind: "somatic", label: "Hépatite C" });
    fresh.events.push(ev("e5", "t4", "2019"));
    const out = carryCorrections(mine, fresh);

    const label = (e: TimelineEvent) => out.tracks.find((x) => x.id === e.trackId)!.label;
    expect(out.events.map((e) => `${label(e)} ${e.start}`).sort()).toEqual(["Alcool 2003", "Alcool 2013", "Armée 2003", "Hépatite C 2019", "Séparation des parents 1998"]);
    expect(out.events.find((e) => label(e) === "Alcool" && e.start === "2013")).toMatchObject({ note: "corrigé", edited: "changed", observationIds: [] });
    expect(out.events.find((e) => label(e) === "Alcool" && e.start === "2003")).toMatchObject({ verdict: "ok", key: true });
    expect(out.events.find((e) => label(e) === "Armée")).toMatchObject({ edited: "added" });
    expect(new Set(out.events.map((e) => e.id)).size).toBe(out.events.length);
    expect(out.removed).toHaveLength(1);
    expect(out.missing).toBe("une hospitalisation en 2021");
  });

  it("changes nothing when nothing was corrected", () => {
    const fresh = frise();
    expect(carryCorrections(frise(), fresh).events).toEqual(fresh.events);
  });
});

describe("landmarks of the short view", () => {
  it("prefers first uses, life before follow-up and first care, without letting one part take all", () => {
    const t = frise();
    t.tracks.push({ id: "t4", kind: "medication", label: "Diazépam" });
    t.events.push(ev("e5", "t4", "2024"));
    const picked = keyEvents(t, dateStart("2023-09"), 3).map((e) => e.id);
    // Three events come before follow-up; the first care, during it, keeps its place.
    expect(picked).toEqual(["e3", "e1", "e4"]);
  });

  it("obeys what the reader forced in or out", () => {
    let t = frise();
    t.tracks.push({ id: "t4", kind: "medication", label: "Diazépam" });
    t.events.push(ev("e5", "t4", "2024"));
    t = setKey(setKey(t, "e5", true), "e3", false);
    const picked = keyEvents(t, dateStart("2023-09"), 3).map((e) => e.id);
    expect(picked).toContain("e5");
    expect(picked).not.toContain("e3");
    expect(picked).toHaveLength(3);
  });
});

describe("axis in two parts", () => {
  const [min, cut, max] = [dateStart("1990"), dateStart("2023"), dateStart("2025")];

  it("gives the history a bounded share and stays monotonic", () => {
    expect(historyShare(min, cut, max)).toBe(0.45);
    expect(historyShare(dateStart("2022"), cut, max)).toBe(0.25);
    const x = splitScale(min, cut, max);
    expect(x(min)).toBe(0);
    expect(x(cut)).toBeCloseTo(0.45);
    expect(x(max)).toBe(1);
    const xs = ["1990", "2000", "2010", "2023", "2024", "2025"].map((d) => x(dateStart(d)));
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
    // Two years of follow-up get more room than thirty-three years of history.
    expect(x(max) - x(cut)).toBeGreaterThan(x(cut) - x(min));
  });

  it("thins year labels to what fits", () => {
    expect(ticks(min, cut, 5).map((t) => t.label)).toEqual(["1990", "2000", "2010", "2020"]);
    expect(ticks(cut, max, 14).length).toBeGreaterThan(3); // quarters on a short span
  });
});

describe("landmarks never repeat a name", () => {
  it("shows once a fact read under two headings", () => {
    const t = frise();
    t.tracks.push({ id: "t4", kind: "psychiatric", label: "Séparation des parents" });
    t.events.push(ev("e5", "t4", "1998"));
    const names = keyEvents(t, dateStart("2023-09"), 10).map((e) => t.tracks.find((x) => x.id === e.trackId)!.label);
    expect(names.filter((n) => n === "Séparation des parents")).toHaveLength(1);
  });
});

describe("corrections kept in the browser", () => {
  const obs = (id: string, date: string, line: number): Observation => ({ id, doc: "d1", start: { page: 1, line }, end: { page: 1, line: line + 3 }, date, kind: "consultation", authorRole: null, summary: "" });
  const memory = () => {
    const m = new Map<string, string>();
    return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
  };

  it("keys a dossier by its observations, not by the ids of the session", () => {
    const a = [obs("doc1:o1", "2023-09-04", 1), obs("doc1:o2", "2023-10-02", 9)];
    const b = [obs("doc7:o1", "2023-09-04", 1), obs("doc7:o2", "2023-10-02", 9)];
    expect(dossierKey(a)).toBe(dossierKey(b));
    expect(dossierKey(a)).not.toBe(dossierKey([a[0]]));
  });

  it("puts the corrections back on the same dossier opened again, and stores nothing untouched", () => {
    const store = memory();
    const observations = [obs("o1", "2023-09-04", 1)];
    storeCorrections(observations, frise(), store);
    expect(store.m.size).toBe(0);
    const mine = removeEvent(setVerdict(frise(), "e1", "ok"), "e3");
    storeCorrections(observations, mine, store);
    expect(store.m.size).toBe(1);
    const back = restoreCorrections(observations, frise(), store);
    expect(back.events.map((e) => e.id)).toEqual(["e1", "e2", "e4"]);
    expect(back.events[0].verdict).toBe("ok");
    // Another dossier is left as read; a correction undone empties the store.
    expect(restoreCorrections([obs("o1", "2020-01-01", 1)], frise(), store).events).toHaveLength(4);
    storeCorrections(observations, frise(), store);
    expect(store.m.size).toBe(0);
  });

  it("survives a store that holds something else", () => {
    const store = memory();
    const observations = [obs("o1", "2023-09-04", 1)];
    store.setItem(dossierKey(observations), "{not json");
    expect(restoreCorrections(observations, frise(), store).events).toHaveLength(4);
  });
});
