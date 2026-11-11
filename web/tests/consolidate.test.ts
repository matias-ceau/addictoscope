import { describe, expect, it } from "vitest";

import type { CloudPolicy } from "../src/cloud/guard";
import { CloudRefused } from "../src/cloud/guard";
import { hasConsolidation, replayFetch } from "../src/cloud/replay";
import { reidentifyTimeline } from "../src/core/reidentify";
import type { PageText } from "../src/core/types";
import type { Manifest } from "../src/core/verify";
import { applyConsolidation, consolidateTimeline, consolidationMessage, CONSOLIDATION_SCHEMA } from "../src/notebook/consolidate";
import { tellingsDisagree, type Observation, type Timeline, type TimelineEvent, type Track } from "../src/notebook/model";
import { buildTimeline, lotCount } from "../src/notebook/timeline";

const obs = (id: string, date: string | null, line = 0): Observation => ({
  id, doc: "historique", date, kind: "médicale", authorRole: null, summary: "",
  start: { page: 0, line }, end: { page: 0, line: line + 1 },
});
const observations = [obs("o1", "2021-03-14"), obs("o2", "2022-06-02"), obs("o3", "2023-11-20"), obs("o4", "2024-05-06")];
const track = (id: string, label: string, kind: Track["kind"] = "life_event"): Track => ({ id, kind, label });
const event = (id: string, trackId: string, start: string, o: Partial<TimelineEvent> = {}): TimelineEvent => ({
  id, trackId, start, end: null, ongoing: false, mode: null, lossOfControl: false, note: `note ${id}`, observationIds: ["o1"], ...o,
});
const frise = (tracks: Track[], events: TimelineEvent[]): Timeline => ({ tracks, events, undated: [] });
const apply = (t: Timeline, answer: unknown) => applyConsolidation(t, answer as Parameters<typeof applyConsolidation>[1], observations, 3);

describe("applyConsolidation: tracks", () => {
  const t = frise(
    [track("t1", "Accident de moto"), track("t2", "Accident de la voie publique (moto)"), track("t3", "Oxycodone", "medication"), track("t4", "Divorce")],
    [event("e1", "t1", "2014"), event("e2", "t2", "2014-10-14", { observationIds: ["o3"] }), event("e3", "t3", "2015"), event("e4", "t4", "2019")],
  );

  it("makes one track of two labels for the same thing, under the label kept", () => {
    const out = apply(t, { tracks: [{ label: " accident de la voie publique (moto)", track_ids: ["t2", "t1"] }], events: [] });
    expect(out.tracks.map((x) => [x.id, x.label])).toEqual([["t1", "Accident de la voie publique (moto)"], ["t3", "Oxycodone"], ["t4", "Divorce"]]);
    // The label not kept stays on the track; a track left alone has none.
    expect(out.tracks.map((x) => x.aliases)).toEqual([["Accident de moto"], undefined, undefined]);
    expect(out.events.map((e) => e.trackId)).toEqual(["t1", "t1", "t3", "t4"]);
    expect(out.consolidation).toMatchObject({ lots: 3, tracksBefore: 4, tracksAfter: 3, eventsBefore: 4, eventsAfter: 4, discordant: 0 });
  });

  it("never merges tracks of two kinds, unknown tracks, or a track already merged", () => {
    const out = apply(t, {
      tracks: [
        { label: "x", track_ids: ["t1", "t3"] }, // life event with a medication
        { label: "y", track_ids: ["t4", "t99"] },
        { label: "Accident", track_ids: ["t1", "t2"] },
        { label: "z", track_ids: ["t2", "t4"] }, // t2 is taken
      ],
      events: [],
    });
    expect(out.tracks.map((x) => x.label)).toEqual(["Accident de moto", "Oxycodone", "Divorce"]);
  });

  it("never takes a label the model wrote: the one of the track holding the most events", () => {
    const three = frise(
      [track("t1", "Sevrage hospitalier"), track("t2", "Hospitalisation de sevrage"), track("t3", "Cure")],
      [event("e1", "t1", "2019"), event("e2", "t2", "2021"), event("e3", "t2", "2023"), event("e4", "t3", "2024")],
    );
    const out = apply(three, { tracks: [{ label: "Hospitalisations pour sevrage (toutes)", track_ids: ["t1", "t2", "t3"] }], events: [] });
    expect(out.tracks).toEqual([{ ...track("t1", "Hospitalisation de sevrage"), aliases: ["Sevrage hospitalier", "Cure"] }]);
    // Regrouped again: the labels already set aside are kept, once each.
    const again = apply({ ...out, tracks: [...out.tracks, track("t9", "cure")], events: [...out.events, event("e9", "t9", "2025")] }, {
      tracks: [{ label: "Cure", track_ids: ["t1", "t9"] }],
      events: [],
    });
    expect(again.tracks).toEqual([{ ...track("t1", "cure"), aliases: ["Hospitalisation de sevrage", "Sevrage hospitalier"] }]);
    // No label at all, or as many events each: the first of the group.
    expect(apply(t, { tracks: [{ track_ids: ["t2", "t1"] }], events: [] }).tracks[0].label).toBe("Accident de moto");
  });

  it("merges the events two merged tracks had in common, as two lots do", () => {
    const twice = frise([track("t1", "VHC", "somatic"), track("t2", "Hépatite C", "somatic")], [event("e1", "t1", "2016"), event("e2", "t2", "2016", { observationIds: ["o2"] })]);
    const out = apply(twice, { tracks: [{ label: "Hépatite C", track_ids: ["t1", "t2"] }], events: [] });
    expect(out.events).toHaveLength(1);
    expect(out.events[0]).toMatchObject({ id: "e1", observationIds: ["o1", "o2"] });
    expect(out.events[0].tellings).toHaveLength(2);
  });

  it("keeps the antecedents not placed on the axis on the merged track", () => {
    const t2 = { ...t, undated: [{ ...event("u1", "t2", "x"), startAge: [9, 9] as [number, number], endAge: null }] };
    expect(apply(t2, { tracks: [{ label: "", track_ids: ["t1", "t2"] }], events: [] }).undated[0].trackId).toBe("t1");
  });

  it("leaves the frise as it is on an answer that is not one", () => {
    for (const answer of [null, {}, { tracks: "t1", events: [{ event_ids: "e1" }] }, { tracks: [{}], events: [null] }]) {
      const out = apply(t, answer);
      expect(out.tracks).toEqual(t.tracks);
      expect(out.events).toEqual(t.events);
    }
  });
});

describe("applyConsolidation: events", () => {
  const one = (events: TimelineEvent[], tracks = [track("t1", "Accident de moto")]) => frise(tracks, events);

  it("keeps the most precise start, every source in order and each telling", () => {
    const t = one([
      event("e1", "t1", "2014", { observationIds: ["o3"] }),
      event("e2", "t1", "2014-10-14", { observationIds: ["o2", "o1"], note: "courrier" }),
      event("e3", "t1", "2014-10", { observationIds: ["o4"] }),
    ]);
    const out = apply(t, { tracks: [], events: [{ event_ids: ["e1", "e2", "e3"], start: "2014-10-14", end: null }] });
    expect(out.events).toHaveLength(1);
    expect(out.events[0]).toMatchObject({ id: "e1", start: "2014-10-14", end: null, note: "courrier", observationIds: ["o1", "o2", "o3", "o4"] });
    expect(out.events[0].tellings?.map((m) => m.start)).toEqual(["2014", "2014-10-14", "2014-10"]);
    expect(tellingsDisagree(out.events[0].tellings)).toBe(false);
    expect(out.consolidation).toMatchObject({ eventsBefore: 3, eventsAfter: 1, discordant: 0 });
  });

  it("shows two tellings that cannot both be right, and keeps the start chosen", () => {
    const t = one([event("e1", "t1", "2013", { note: "selon le patient" }), event("e2", "t1", "2014-10-14", { note: "courrier", observationIds: ["o2"] })]);
    const out = apply(t, { tracks: [], events: [{ event_ids: ["e1", "e2"], start: "2014-10-14", end: null }] });
    expect(out.events[0].start).toBe("2014-10-14");
    expect(out.events[0].tellings).toEqual([
      { start: "2013", end: null, note: "selon le patient", observationIds: ["o1"] },
      { start: "2014-10-14", end: null, note: "courrier", observationIds: ["o2"] },
    ]);
    expect(out.consolidation?.discordant).toBe(1);
  });

  it("takes a start the group does not hold for the most precise one it holds", () => {
    const t = one([event("e1", "t1", "2014"), event("e2", "t1", "2014-10")]);
    const out = apply(t, { tracks: [], events: [{ event_ids: ["e1", "e2"], start: "2012-01-01", end: "2030" }] });
    expect(out.events[0]).toMatchObject({ start: "2014-10", end: null });
  });

  it("closes an episode told in two pieces: going on in one lot, stopped in another", () => {
    const meds = [track("t1", "Acamprosate", "medication")];
    const t = one(
      [
        event("e1", "t1", "2022-03-14", { ongoing: true }),
        event("e2", "t1", "2022-08", { observationIds: ["o3"], note: "arrêté par le patient" }),
      ],
      meds,
    );
    const out = apply(t, { tracks: [], events: [{ event_ids: ["e1", "e2"], start: "2022-03-14", end: "2022-08" }] });
    expect(out.events[0]).toMatchObject({ start: "2022-03-14", end: "2022-08", ongoing: false });
  });

  it("prefers a told start to the date of a first mention, and its end stays", () => {
    const meds = [track("t1", "Acamprosate", "medication")];
    const t = one(
      [
        event("e1", "t1", "2022-06-02", { end: "2022-08", startUnknown: true, observationIds: ["o2"] }),
        event("e2", "t1", "2022-03", { ongoing: true }),
      ],
      meds,
    );
    // The model answers the mention date and no end: neither is taken.
    const out = apply(t, { tracks: [], events: [{ event_ids: ["e1", "e2"], start: "2022-06-02", end: null }] });
    expect(out.events[0]).toMatchObject({ start: "2022-03", end: "2022-08", ongoing: false });
    expect(out.events[0].startUnknown).toBeUndefined();
    expect(out.events[0].tellings?.[0].start).toBeNull();
  });

  it("says still going on only if the latest telling says so", () => {
    const t = one([event("e1", "t1", "2019", { ongoing: true }), event("e2", "t1", "2019-05", { observationIds: ["o4"] })]);
    expect(apply(t, { tracks: [], events: [{ event_ids: ["e1", "e2"], start: "2019-05", end: null }] }).events[0].ongoing).toBe(false);
    const later = one([event("e1", "t1", "2019"), event("e2", "t1", "2019-05", { observationIds: ["o4"], ongoing: true })]);
    expect(apply(later, { tracks: [], events: [{ event_ids: ["e1", "e2"], start: "2019-05", end: null }] }).events[0].ongoing).toBe(true);
  });

  it("never merges two modes, two tracks, an unknown event or an event already merged", () => {
    const tracks = [track("t1", "Alcool", "substance_use"), track("t2", "Cannabis", "substance_use")];
    const t = one(
      [
        event("e1", "t1", "2019", { mode: "usage" }),
        event("e2", "t1", "2019", { mode: "sevrage" }),
        event("e3", "t2", "2019", { mode: "usage" }),
        event("e4", "t1", "2019-03", { mode: "usage" }),
        event("e5", "t1", "2019-06", { mode: "usage" }),
      ],
      tracks,
    );
    const out = apply(t, {
      tracks: [],
      events: [
        { event_ids: ["e1", "e2", "e3", "e4", "e99"], start: "2019-03", end: null },
        { event_ids: ["e4", "e5"], start: "2019-06", end: null }, // e4 is taken
      ],
    });
    expect(out.events.map((e) => e.id)).toEqual(["e1", "e2", "e3", "e5"]);
    expect(out.events[0]).toMatchObject({ start: "2019-03", mode: "usage" });
  });

  it("keeps an age only on the bound it was worked out for, and a loss of control any telling had", () => {
    const t = one([
      event("e1", "t1", "1998", { end: "2001", fromAge: { start: [14, 14], end: [17, 17] }, observationIds: ["o2"] }),
      event("e2", "t1", "1998", { end: "2003", lossOfControl: true }),
    ]);
    const out = apply(t, { tracks: [], events: [{ event_ids: ["e1", "e2"], start: "1998", end: "2003" }] });
    expect(out.events[0]).toMatchObject({ end: "2003", lossOfControl: true, fromAge: { start: [14, 14], end: null } });
  });

  it("merges again what was already regrouped, without losing a telling", () => {
    const t = one([event("e1", "t1", "2014"), event("e2", "t1", "2014-10"), event("e3", "t1", "2014-10-14")]);
    const first = apply(t, { tracks: [], events: [{ event_ids: ["e1", "e2"], start: "2014-10", end: null }] });
    const second = apply(first, { tracks: [], events: [{ event_ids: ["e1", "e3"], start: "2014-10-14", end: null }] });
    expect(second.events[0].tellings).toHaveLength(3);
  });

  it("gives the real names back in the tellings too, locally", () => {
    const t = one([event("e1", "t1", "2014", { note: "avec [PERSONNE_1]" }), event("e2", "t1", "2014-10", { note: "[PERSONNE_1] conduisait" })]);
    const out = apply(t, { tracks: [], events: [{ event_ids: ["e1", "e2"], start: "2014-10", end: null }] });
    const real = reidentifyTimeline(out, new Map([["[PERSONNE_1]", "Odile Vasseur"]]));
    expect(real.events[0].tellings?.map((m) => m.note)).toEqual(["avec Odile Vasseur", "Odile Vasseur conduisait"]);
  });

  it("gives the real names back in the labels set aside too", () => {
    const two = frise(
      [track("t1", "Suivi par [SOIGNANT_2]"), track("t2", "Consultations [SOIGNANT_2]")],
      [event("e1", "t1", "2020"), event("e2", "t2", "2021")],
    );
    const out = apply(two, { tracks: [{ label: "Suivi par [SOIGNANT_2]", track_ids: ["t1", "t2"] }], events: [] });
    const real = reidentifyTimeline(out, new Map([["[SOIGNANT_2]", "Dr Maëlle Kerbrat"]]));
    expect(real.tracks).toEqual([{ ...track("t1", "Suivi par Dr Maëlle Kerbrat"), aliases: ["Consultations Dr Maëlle Kerbrat"] }]);
  });
});

describe("the regroupement call", () => {
  const verified = { verified: true, reviewedByHuman: true, leaks: [] } as unknown as Manifest;
  const policy: CloudPolicy = { kind: "openrouter-zdr", apiKey: "sk-test", model: "a/model" };
  const t = frise(
    [track("t1", "Alcool", "substance_use"), track("t2", "Accident de moto"), track("t3", "Accident (moto)")],
    [
      event("e1", "t1", "2010", { mode: "usage", ongoing: true, note: "x".repeat(300), observationIds: ["o1", "o2", "o3", "o4"] }),
      event("e2", "t2", "2014", { note: "raconté par [PATIENT]" }),
      event("e3", "t3", "2014-10-14", { observationIds: ["o3"], startUnknown: true }),
    ],
  );
  type Call = { schema: string; system: string; user: string };
  const fake = (answer: unknown, calls: Call[], status = 200) =>
    (async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      const text = (role: string) => body.messages.find((m: { role: string }) => m.role === role).content as string;
      calls.push({ schema: body.response_format.json_schema.name, system: text("system"), user: text("user") });
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(answer) } }] }), { status });
    }) as unknown as typeof fetch;
  const input = (fetchImpl: typeof fetch, manifests: Record<string, Manifest | undefined> = { historique: verified }) => ({ observations, manifests, policy, fetchImpl });

  it("shows the model tracks and events, never an observation", () => {
    const message = consolidationMessage(t, observations, 3);
    expect(message).toContain("Frise lue en 3 lots : 3 pistes, 3 événements. Dernière observation du dossier : 2024-05-06.");
    expect(message).toContain("## Consommations\n\n### t1 — Alcool\n- e1 | 2010 → en cours au 2024-05-06 | usage | " + "x".repeat(140) + "… | vu le 2021-03-14, 2022-06-02, 2023-11-20 (+1)");
    expect(message).toContain("### t3 — Accident (moto)\n- e3 | 2014-10-14 (début non précisé) | note e3 | vu le 2023-11-20");
    expect(message.indexOf("## Consommations")).toBeLessThan(message.indexOf("## Événements de vie"));
  });

  it("asks once, under its own name, and merges what the answer groups", async () => {
    const calls: Call[] = [];
    const answer = { tracks: [{ label: "Accident de moto", track_ids: ["t2", "t3"] }], events: [{ event_ids: ["e2", "e3"], start: "2014", end: null }] };
    const out = await consolidateTimeline(t, input(fake(answer, calls)), 3);
    expect(calls.map((c) => c.schema)).toEqual(["regroupement"]);
    expect(calls[0].user).toBe(consolidationMessage(t, observations, 3));
    expect(out.tracks).toHaveLength(2);
    expect(out.events.map((e) => e.id)).toEqual(["e1", "e2"]);
    expect(out.consolidation).toMatchObject({ lots: 3, tracksBefore: 3, tracksAfter: 2, eventsBefore: 3, eventsAfter: 2 });
    expect(out.consolidation?.failed).toBeUndefined();
  });

  it("goes through the guard like any other call", async () => {
    const calls: Call[] = [];
    await expect(consolidateTimeline(t, input(fake({ tracks: [], events: [] }, calls), {}), 3)).rejects.toBeInstanceOf(CloudRefused);
    expect(calls).toEqual([]);
  });

  it("keeps the frise as read, and says so, when the call fails", async () => {
    const out = await consolidateTimeline(t, input(fake({}, [], 500)), 3);
    expect(out.events).toEqual(t.events);
    expect(out.tracks).toEqual(t.tracks);
    expect(out.consolidation).toMatchObject({ eventsBefore: 3, eventsAfter: 3 });
    expect(out.consolidation?.failed).toContain("500");
    const down = (async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    expect((await consolidateTimeline(t, input(down), 3)).consolidation?.failed).toBe("Failed to fetch");
  });

  it("has a strict schema: groups of ids, a start and an end", () => {
    expect(CONSOLIDATION_SCHEMA.required).toEqual(["tracks", "events"]);
    expect(CONSOLIDATION_SCHEMA.properties.events.items.required).toEqual(["event_ids", "start", "end"]);
    expect(CONSOLIDATION_SCHEMA.properties.tracks.items.additionalProperties).toBe(false);
  });
});

describe("analyse: a dossier read in several lots", () => {
  const verified = { verified: true, reviewedByHuman: true, leaks: [] } as unknown as Manifest;
  const policy: CloudPolicy = { kind: "openrouter-zdr", apiKey: "sk-test", model: "a/model" };
  // A layout the rules split: one header line per observation.
  const header = (date: string) => `Observation médicale du ${date}`;
  const body = (word: string) => Array.from({ length: 40 }, () => `${word} `.repeat(12).trim());
  const lines = [header("10/01/2024"), ...body("alpha"), header("11/02/2024"), ...body("bravo")];
  const page: PageText = { page: 0, width: 1, height: 1, text: lines.join("\n") + "\n", words: [], source: "pdf" };
  const long: Observation[] = [
    { ...obs("historique:o1", "2024-01-10"), start: { page: 0, line: 0 }, end: { page: 0, line: 40 } },
    { ...obs("historique:o2", "2024-02-11"), start: { page: 0, line: 41 }, end: { page: 0, line: 81 } },
  ];
  const timelineInput = (fetchImpl: typeof fetch, charsPerCall?: number) => ({
    observations: long, pagesByDoc: { historique: [page] }, manifests: { historique: verified }, policy, fetchImpl, charsPerCall,
  });
  const ev = (label: string, start: string, id: string) => ({
    kind: "life_event", label, start, end: null, start_age: null, end_age: null, ongoing: false, mode: null, loss_of_control: false, note: "", observation_ids: [id],
  });
  const recording = (withRegroupement: boolean) => ({
    model: "a/model", cost: 0, elapsedMs: 0,
    answers: [
      { schema: "frise", content: { events: [ev("Accident de moto", "2014", "o1")] } },
      { schema: "frise", content: { events: [ev("Accident (moto)", "2014-10-14", "o2")] } },
      ...(withRegroupement
        ? [{ schema: "regroupement", content: { tracks: [{ label: "Accident de moto", track_ids: ["t1", "t2"] }], events: [{ event_ids: ["e1", "e2"], start: "2014-10-14", end: null }] } }]
        : []),
    ],
  });

  it("counts the lots the observations are read in", () => {
    expect(lotCount(timelineInput(fetch))).toBe(1);
    expect(lotCount(timelineInput(fetch, 600))).toBe(2);
  });

  it("is not regrouped by buildTimeline itself: the frise as read stays available", async () => {
    const t = await buildTimeline(timelineInput(replayFetch(recording(true)), 600));
    expect(t.events).toHaveLength(2);
    expect(t.consolidation).toBeUndefined();
  });

  it("tells a recording made with the regroupement from an older one", () => {
    expect(hasConsolidation(recording(true))).toBe(true);
    expect(hasConsolidation(recording(false))).toBe(false);
  });
});
