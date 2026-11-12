import { describe, expect, it } from "vitest";

import type { Observation, Timeline } from "../src/notebook/model";
import { applyProofreading, proofreadMessage } from "../src/notebook/proofread";
import { applyUpdates, carriedMessage, type RawEvent } from "../src/notebook/timeline";

const obs = (id: string, date: string): Observation => ({
  id,
  doc: "historique",
  start: { page: 0, line: 1 },
  end: { page: 0, line: 2 },
  date,
  kind: "Observation de suivi",
  authorRole: null,
  summary: "",
});

const raw = (over: Partial<RawEvent>): RawEvent => ({
  kind: "medication",
  label: "Méthadone",
  start: "2024-01",
  end: null,
  ongoing: true,
  mode: null,
  loss_of_control: false,
  note: "Introduite à 5 mg",
  observation_ids: ["historique:o1"],
  ...over,
});

describe("a frise carried from one lot to the next", () => {
  it("lists the events already read, numbered, for the next lot", () => {
    const text = carriedMessage([raw({}), raw({ kind: "substance_use", label: "Alcool", start: "2020", ongoing: false, end: "2023-05" })], "### o3 — 2025-01-10\nsuite");
    expect(text).toContain("e1 | medication / Méthadone | 2024-01 → en cours | Introduite à 5 mg");
    expect(text).toContain("e2 | substance_use / Alcool | 2020 → 2023-05");
    expect(text.indexOf("e2 |")).toBeLessThan(text.indexOf("### o3"));
  });

  it("closes or corrects an earlier event instead of repeating it", () => {
    const events = [raw({}), raw({ label: "Paroxétine", start: "2013" })];
    const realId = new Map([["o7", "historique:o7"]]);
    const out = applyUpdates(
      events,
      [
        { id: "e1", start: null, end: "2025-07", ongoing: false, note: "", observation_ids: ["o7"] },
        { id: "e2", start: "2012", end: null, ongoing: true, note: "Prescrite depuis 2012", observation_ids: [] },
        { id: "e9", start: null, end: "2020", ongoing: false, note: "", observation_ids: [] },
      ],
      realId,
    );
    expect(out[0]).toMatchObject({ start: "2024-01", end: "2025-07", ongoing: false, note: "Introduite à 5 mg", observation_ids: ["historique:o1", "historique:o7"] });
    expect(out[1]).toMatchObject({ start: "2012", end: null, ongoing: true, note: "Prescrite depuis 2012" });
    expect(out).toHaveLength(2);
    // The events given are left as they were.
    expect(events[0].end).toBeNull();
  });
});

describe("a frise read again against its text", () => {
  const observations = [obs("historique:o1", "2024-01-03"), obs("historique:o2", "2025-09-02")];
  const timeline: Timeline = {
    tracks: [
      { id: "t1", kind: "medication", label: "Méthadone" },
      { id: "t2", kind: "medication", label: "Zolpidem" },
    ],
    events: [
      { id: "ev1", trackId: "t1", start: "2024-01", end: "2025-07", ongoing: false, mode: null, lossOfControl: false, note: "Introduite", observationIds: ["historique:o1"] },
      { id: "ev2", trackId: "t2", start: "2024-01", end: null, ongoing: false, mode: null, lossOfControl: false, note: "Demandé", observationIds: ["historique:o1"] },
    ],
    undated: [],
  };

  it("shows every event with a number and the whole text", () => {
    const text = proofreadMessage(timeline, observations, new Map([["historique:o1", "### o1 — 2024-01-03\nméthadone introduite"], ["historique:o2", "### o2 — 2025-09-02\nrenouvelée"]]));
    expect(text).toContain("e1 | medication / Méthadone | 2024-01 → 2025-07 | Introduite | o1");
    expect(text).toContain("e2 | medication / Zolpidem");
    expect(text).toContain("renouvelée");
  });

  it("corrects, removes and adds what the reviewer says", () => {
    const out = applyProofreading(
      timeline,
      {
        verdicts: [
          { id: "e1", verdict: "fix", start: null, end: null, ongoing: true, note: "", reason: "toujours renouvelée en 09/2025" },
          { id: "e2", verdict: "wrong", start: null, end: null, ongoing: false, note: "", reason: "demandé, jamais prescrit" },
          { id: "e7", verdict: "wrong", start: null, end: null, ongoing: false, note: "", reason: "inconnu" },
        ],
        missing: [raw({ kind: "life_event", label: "Naissance d'un fils", start: "1998", ongoing: false, note: "Fils de 17 ans en 2015", observation_ids: ["o2"] })],
      },
      observations,
    );
    expect(out.events.find((e) => e.id === "ev1")).toMatchObject({ end: null, ongoing: true, start: "2024-01" });
    expect(out.events.some((e) => e.id === "ev2")).toBe(false);
    expect(out.tracks.some((t) => t.label === "Zolpidem")).toBe(false);
    const added = out.events.find((e) => e.note === "Fils de 17 ans en 2015")!;
    expect(added).toMatchObject({ start: "1998", observationIds: ["historique:o2"] });
    expect(out.tracks.find((t) => t.id === added.trackId)).toMatchObject({ kind: "life_event", label: "Naissance d'un fils" });
    expect(out.proofreading).toEqual({ checked: 2, fixed: 1, removed: 1, added: 1 });
    // The frise given is left as it was.
    expect(timeline.events).toHaveLength(2);
  });

  it("leaves a date alone when the correction is not a date, and keeps an end that is before the start out", () => {
    const out = applyProofreading(
      timeline,
      { verdicts: [{ id: "e1", verdict: "fix", start: "janvier", end: "2020", ongoing: false, note: "Note juste", reason: "" }], missing: [] },
      observations,
    );
    expect(out.events[0]).toMatchObject({ start: "2024-01", end: "2025-07", note: "Note juste" });
  });
});
