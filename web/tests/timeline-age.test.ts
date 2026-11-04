import { describe, expect, it } from "vitest";

import type { CloudPolicy } from "../src/cloud/guard";
import { keyTableFromDetections } from "../src/core/reidentify";
import type { Category, Detection, PageText } from "../src/core/types";
import type { Manifest } from "../src/core/verify";
import type { Observation } from "../src/notebook/model";
import { assembleTimeline, buildTimeline } from "../src/notebook/timeline";

type RawEvents = Parameters<typeof assembleTimeline>[0];

/** A raw model event; age-based events have `start: null` and `start_age`. */
const raw = (o: Record<string, unknown>) => ({
  kind: "substance_use",
  label: "Alcool",
  start: null,
  end: null,
  start_age: null,
  end_age: null,
  ongoing: false,
  mode: "usage",
  loss_of_control: false,
  note: "",
  observation_ids: ["d:o1"],
  ...o,
});
const assemble = (events: Record<string, unknown>[], birthYear: number | null) =>
  assembleTimeline(events.map(raw) as unknown as RawEvents, new Set(["d:o1", "d:o2"]), birthYear);

describe("assembleTimeline with ages", () => {
  it("resolves an exact age to the year it was reached", () => {
    const t = assemble([{ start_age: 14, note: "À 14 ans, premières ivresses." }], 1961);
    expect(t.events).toHaveLength(1);
    const e = t.events[0];
    expect(e.start).toBe("1975");
    expect(e.end).toBeNull();
    expect(e.note).toBe("À 14 ans, premières ivresses.");
    expect(e.fromAge).toEqual({ start: [14, 14], end: null });
    expect(t.undated).toEqual([]);
  });

  it("accepts an age given as a numeric string", () => {
    const t = assemble([{ start_age: "14" }], 1961);
    expect(t.events.map((e) => e.start)).toEqual(["1975"]);
  });

  it("turns a range without end into a period", () => {
    const t = assemble([{ start_age: [12, 17] }], 1961);
    const e = t.events[0];
    expect(e.start).toBe("1973");
    expect(e.end).toBe("1978");
    expect(e.fromAge).toMatchObject({ start: [12, 17] });
  });

  it("turns a named period into a period", () => {
    const t = assemble([{ start_age: "adolescence" }], 1961);
    expect(t.events.map((e) => [e.start, e.end])).toEqual([["1973", "1978"]]);
    expect(t.events[0].fromAge).toMatchObject({ start: [12, 17] });
  });

  it("keeps a dated end over the end of the range", () => {
    const t = assemble([{ start_age: [12, 17], end: "1990" }], 1961);
    expect(t.events.map((e) => [e.start, e.end])).toEqual([["1973", "1990"]]);
  });

  it("does not close a range that is still ongoing", () => {
    const t = assemble([{ start_age: "adolescence", ongoing: true }], 1961);
    const e = t.events[0];
    expect(e.start).toBe("1973");
    expect(e.end).toBeNull();
    expect(e.ongoing).toBe(true);
  });

  it("resolves end_age like start_age", () => {
    const t = assemble([{ start_age: 15, end_age: 20 }], 1961);
    const e = t.events[0];
    expect([e.start, e.end]).toEqual(["1976", "1981"]);
    expect(e.fromAge).toEqual({ start: [15, 15], end: [20, 20] });
  });

  it("resolves end_age on an event with a dated start", () => {
    const t = assemble([{ start: "1980", end_age: 25 }], 1961);
    const e = t.events[0];
    expect([e.start, e.end]).toEqual(["1980", "1986"]);
    expect(e.fromAge).toEqual({ start: null, end: [25, 25] });
  });

  it("lists age-based events as undated without a birth year", () => {
    const t = assemble(
      [
        { start_age: 14, note: "Premier joint à 14 ans.", label: "Cannabis" },
        { start_age: [15, 15], end_age: 20, note: "Alcool de 15 à 20 ans." },
      ],
      null,
    );
    expect(t.events).toEqual([]);
    expect(t.undated).toHaveLength(2);
    expect(t.undated[0]).toMatchObject({ note: "Premier joint à 14 ans.", startAge: [14, 14], endAge: null, observationIds: ["d:o1"] });
    expect(t.undated[1]).toMatchObject({ note: "Alcool de 15 à 20 ans.", startAge: [15, 15], endAge: [20, 20] });
    const cannabis = t.tracks.find((x) => x.id === t.undated[0].trackId);
    expect(cannabis?.label).toBe("Cannabis");
    expect((t.undated[0] as Record<string, unknown>).start).toBeUndefined();
    expect((t.undated[0] as Record<string, unknown>).fromAge).toBeUndefined();
  });

  it("defaults to no birth year", () => {
    const t = assembleTimeline([raw({ start_age: 14 })] as unknown as RawEvents, new Set(["d:o1"]));
    expect(t.events).toEqual([]);
    expect(t.undated.map((e) => e.startAge)).toEqual([[14, 14]]);
  });

  it("leaves dated events unchanged", () => {
    const t = assemble(
      [
        { start: "2010-03", end: "2011", mode: "rechute", note: "Rechute." },
        { start: "2015", start_age: 14, kind: "medication", label: "Baclofène", mode: null },
      ],
      1961,
    );
    expect(t.events.map((e) => [e.start, e.end])).toEqual([["2010-03", "2011"], ["2015", null]]);
    expect(t.events[0].fromAge).toBeUndefined();
    expect(t.undated).toEqual([]);
  });

  it("drops events with neither a date nor a readable age", () => {
    const t = assemble(
      [
        { start_age: null },
        { start_age: "n'importe quand" },
        { start_age: [17, 12] },
        { start: "un jour", start_age: null },
      ],
      1961,
    );
    expect(t.events).toEqual([]);
    expect(t.undated).toEqual([]);
  });

  it("still needs a known source for age-based events", () => {
    const t = assemble([{ start_age: 14, observation_ids: ["made-up"] }], 1961);
    const u = assemble([{ start_age: 14, observation_ids: ["made-up"] }], null);
    expect(t.events).toEqual([]);
    expect(u.undated).toEqual([]);
  });
});

const policy: CloudPolicy = { kind: "openrouter-zdr", apiKey: "sk-test", model: "test/model" };
const verified = { verified: true, reviewedByHuman: true, leaks: [] } as unknown as Manifest;
const page = (i: number, lines: string[]): PageText => ({
  page: i, width: 1, height: 1, text: lines.join("\n") + "\n", words: [], source: "pdf",
});

type Seen = { url: string; body: any; raw: string };
function fakeFetch(answers: object[], seen: Seen[]) {
  let i = 0;
  return (async (url: string, init: RequestInit) => {
    seen.push({ url, body: JSON.parse(String(init.body)), raw: String(init.body) });
    const content = JSON.stringify(answers[Math.min(i++, answers.length - 1)]);
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
  }) as unknown as typeof fetch;
}

describe("buildTimeline with ages", () => {
  // The birth year below appears nowhere in the documents.
  const BIRTH_YEAR = 1958;
  const obs = (id: string, date: string, line: number): Observation => ({
    id, doc: "historique", date, kind: "psychiatrique", authorRole: null, summary: "",
    start: { page: 0, line }, end: { page: 0, line: line + 1 },
  });
  const observations = [obs("historique:o1", "2024-04-15", 1), obs("historique:o2", "2024-05-02", 3)];
  const pagesByDoc = {
    historique: [
      page(0, [
        "Observation psychiatrique du 15/04/2024",
        "[PATIENT] rapporte des ivresses à 14 ans, vue avec [SOIGNANT_2].",
        "Observation psychiatrique du 02/05/2024",
        "Cannabis à l'adolescence, appel de [PROCHE_1].",
      ]),
    ],
  };
  const event = (o: Record<string, unknown>) => ({
    kind: "substance_use", label: "Alcool", start: null, end: null, start_age: null, end_age: null,
    ongoing: false, mode: "usage", loss_of_control: false, note: "", observation_ids: ["o1"], ...o,
  });
  const answer = {
    events: [
      event({ start_age: 14, note: "Ivresses à 14 ans." }),
      event({ label: "Cannabis", start_age: "adolescence", observation_ids: ["o2"], note: "Cannabis à l'adolescence." }),
      event({ start_age: 66, note: "Même année que la dernière observation." }),
      event({ start_age: 70, note: "Après la dernière observation." }),
    ],
  };
  const run = (birthYear: number | null | undefined, seen: Seen[]) =>
    buildTimeline({
      observations,
      pagesByDoc,
      manifests: { historique: verified },
      policy,
      birthYear,
      fetchImpl: fakeFetch([answer], seen),
    });

  it("resolves ages with the birth year given locally", async () => {
    const t = await run(BIRTH_YEAR, []);
    const byNote = Object.fromEntries(t.events.map((e) => [e.note, [e.start, e.end]]));
    expect(byNote["Ivresses à 14 ans."]).toEqual(["1972", null]);
    expect(byNote["Cannabis à l'adolescence."]).toEqual(["1970", "1975"]);
    expect(byNote["Même année que la dernière observation."]).toEqual(["2024", null]);
    expect(t.events.map((e) => e.observationIds)).toContainEqual(["historique:o2"]);
  });

  it("sends a date resolved after the last observation to the undated list", async () => {
    const t = await run(BIRTH_YEAR, []);
    expect(t.events.map((e) => e.note)).not.toContain("Après la dernière observation.");
    expect(t.undated.map((e) => e.note)).toEqual(["Après la dernière observation."]);
    expect(t.undated[0].startAge).toEqual([70, 70]);
  });

  it("lists every age-based event as undated without a birth year", async () => {
    const t = await run(undefined, []);
    expect(t.events).toEqual([]);
    expect(t.undated).toHaveLength(4);
  });

  it("never sends the birth year nor the real values to the model", async () => {
    const seen: Seen[] = [];
    await run(BIRTH_YEAR, seen);
    expect(seen.length).toBeGreaterThan(0);

    let n = 0;
    const det = (label: string, text: string, category: Category): Detection => ({
      id: `d${++n}`, doc: "historique", page: 0, start: 0, end: text.length, text, category,
      source: "rule", entity: label, label, rects: [], accepted: true,
    });
    const table = keyTableFromDetections([
      det("[PATIENT]", "VASSEUR Maëlys", "PATIENT"),
      det("[SOIGNANT_2]", "LEROY Martine", "SOIGNANT"),
      det("[PROCHE_1]", "BRUNEL Anatole", "PROCHE"),
      det("[NE(E) EN 1958]", "12/09/1958", "NAISSANCE"),
    ]);
    for (const s of seen) {
      expect(s.raw).not.toContain(String(BIRTH_YEAR));
      for (const value of table.values()) expect(s.raw).not.toContain(value);
      for (const word of ["VASSEUR", "Maëlys", "LEROY", "BRUNEL", "Anatole"]) expect(s.raw).not.toContain(word);
    }
    // The pseudonymised text itself is still sent.
    expect(seen.map((s) => s.body.messages[1].content).join("\n")).toContain("[PATIENT]");
  });
});

describe("an end told by an age range", () => {
  it("ends with the range: until adolescence is until 17", () => {
    const t = assemble([{ start_age: 8, end_age: "adolescence", note: "Placé en foyer de 8 ans à l'adolescence." }], 1990);
    expect(t.events[0].start).toBe("1998");
    expect(t.events[0].end).toBe("2007");
    const dated = assemble([{ start: "2001", end_age: [16, 18] }], 1990);
    expect(dated.events[0].end).toBe("2008");
  });
});
