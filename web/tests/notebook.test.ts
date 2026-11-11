import { describe, expect, it } from "vitest";

import { chatJson } from "../src/cloud/client";
import { CloudRefused, type CloudPolicy } from "../src/cloud/guard";
import type { PageText } from "../src/core/types";
import type { Manifest } from "../src/core/verify";
import type { Observation } from "../src/notebook/model";
import { repeatedLines } from "../src/notebook/lines";
import { assembleTimeline, buildTimeline, TIMELINE_SCHEMA } from "../src/notebook/timeline";
import { repairObservations, SEGMENT_SCHEMA, segmentDocument } from "../src/notebook/segment";

const policy: CloudPolicy = { kind: "openrouter-zdr", apiKey: "sk-test", model: "test/model" };
const verified = { verified: true, reviewedByHuman: true, leaks: [] } as unknown as Manifest;

const page = (i: number, lines: string[]): PageText => ({
  page: i, width: 1, height: 1, text: lines.join("\n") + "\n", words: [], source: "pdf",
});

function fakeFetch(answers: object[], seen: { url: string; body: any; headers: any }[] = []) {
  let i = 0;
  return (async (url: string, init: RequestInit) => {
    seen.push({ url, body: JSON.parse(String(init.body)), headers: init.headers });
    const content = JSON.stringify(answers[Math.min(i++, answers.length - 1)]);
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
  }) as unknown as typeof fetch;
}

describe("cloud client", () => {
  it("asks OpenRouter for zero-retention providers and a strict JSON schema", async () => {
    const seen: { url: string; body: any; headers: any }[] = [];
    const out = await chatJson<{ ok: boolean }>({
      policy, manifests: [verified], messages: [{ role: "user", content: "x" }],
      schemaName: "t", schema: { type: "object" }, fetchImpl: fakeFetch([{ ok: true }], seen),
    });
    expect(out).toEqual({ ok: true });
    expect(seen[0].url).toContain("openrouter.ai");
    expect(seen[0].body.provider).toEqual({ zdr: true, data_collection: "deny" });
    expect(seen[0].body.response_format.json_schema.strict).toBe(true);
    expect(seen[0].headers.Authorization).toBe("Bearer sk-test");
  });

  it("refuses to send unverified or unreviewed documents", async () => {
    const call = (manifests: (Manifest | undefined)[], p: CloudPolicy = policy) =>
      chatJson({ policy: p, manifests, messages: [], schemaName: "t", schema: {}, fetchImpl: fakeFetch([{}]) });
    await expect(call([undefined])).rejects.toBeInstanceOf(CloudRefused);
    await expect(call([{ ...verified, verified: false } as Manifest])).rejects.toBeInstanceOf(CloudRefused);
    await expect(call([verified, undefined])).rejects.toBeInstanceOf(CloudRefused);
    await expect(call([verified], { kind: "off" })).rejects.toBeInstanceOf(CloudRefused);
  });
});

const HEADER = ["CENTRE HOSPITALIER [ETABLISSEMENT_1]", "[PATIENT] IPP [IPP]", "FICHE D'OBSERVATIONS"];
const pages = [
  page(0, [...HEADER, "Observation IDE du 15/04/2024", "Validé par [SOIGNANT_1]", "Rechute ce week-end.", "Début d'une phrase"]),
  page(1, [...HEADER, "coupée par la page.", "Observation psychiatrique du 06/05/2024", "Abstinente depuis 3 semaines.", "Page 2/3"]),
  page(2, [...HEADER, "Observation psychiatrique du 20/06/2024", "Reprise du travail.", "Page 3/3"]),
];

describe("observation segmentation", () => {
  it("spots the repeated header whatever its wording", () => {
    const rep = repeatedLines(pages);
    expect(rep.has("FICHE D'OBSERVATIONS")).toBe(true);
    expect(rep.has("Rechute ce week-end.")).toBe(false);
  });

  it("joins an observation cut by a page break across model calls", async () => {
    const answers = [
      { observations: [
        { start: { page: 1, line: 4 }, end: { page: 1, line: 7 }, date: "2024-04-15", kind: "IDE", author_role: "IDE", continues_previous: false, summary: "rechute" },
        { start: { page: 2, line: 4 }, end: { page: 2, line: 4 }, date: null, kind: "IDE", author_role: null, continues_previous: true, summary: "" },
        { start: { page: 2, line: 5 }, end: { page: 2, line: 6 }, date: "2024-05-06", kind: "psychiatrique", author_role: null, continues_previous: false, summary: "abstinence" },
        { start: { page: 3, line: 4 }, end: { page: 3, line: 5 }, date: "2024-06-20", kind: "psychiatrique", author_role: null, continues_previous: false, summary: "travail" },
      ] },
    ];
    const obs = await segmentDocument({ doc: "d", pages, images: {}, manifest: verified, policy, fetchImpl: fakeFetch(answers) });
    expect(obs.map((o) => o.date)).toEqual(["2024-04-15", "2024-05-06", "2024-06-20"]);
    expect(obs[0].end).toEqual({ page: 1, line: 4 }); // ends on the next page, after the header
  });

  it("repairs overlaps, out-of-range anchors, header-only spans and bad dates", () => {
    const obs = repairObservations("d", pages, [
      { start: { page: 0, line: 4 }, end: { page: 1, line: 6 }, date: "15/04/2024", kind: "IDE", author_role: null, summary: "" },
      { start: { page: 1, line: 5 }, end: { page: 9, line: 99 }, date: "2024-05-06", kind: "psy", author_role: null, summary: "" },
      { start: { page: 2, line: 1 }, end: { page: 2, line: 3 }, date: null, kind: "en-tête", author_role: null, summary: "" },
    ]);
    expect(obs).toHaveLength(2);
    expect(obs[0].end).toEqual({ page: 1, line: 4 });
    expect(obs[0].date).toBeNull();
    expect(obs[1].end).toEqual({ page: 2, line: 6 });
  });

  it("keeps an ISO date the model wrapped in stray punctuation", () => {
    const obs = repairObservations("d", pages, [
      { start: { page: 0, line: 4 }, end: { page: 0, line: 6 }, date: "2024-04-15,", kind: "IDE", author_role: null, summary: "" },
      { start: { page: 1, line: 5 }, end: { page: 1, line: 6 }, date: " 2024-05-06.", kind: "psy", author_role: null, summary: "" },
      { start: { page: 2, line: 4 }, end: { page: 2, line: 5 }, date: "2024-06-20 ou 2024-06-21", kind: "psy", author_role: null, summary: "" },
    ]);
    expect(obs.map((o) => o.date)).toEqual(["2024-04-15", "2024-05-06", null]);
  });
});

describe("timeline assembly", () => {
  const raw = (o: Partial<Parameters<typeof assembleTimeline>[0][number]>) => ({
    kind: "substance_use", label: "Alcool", start: "2024-04", end: null, ongoing: false, mode: "rechute",
    loss_of_control: false, note: "", observation_ids: ["d:o1"], ...o,
  });

  it("keeps only sourced, well-dated events and groups them by track", () => {
    const t = assembleTimeline(
      [
        raw({}),
        raw({ label: "alcool", start: "2024-05-06", mode: "usage" }),
        raw({ observation_ids: ["made-up"] }),
        raw({ start: "avril 2024" }),
        raw({ kind: "medication", label: "Acamprosate", start: "2024-02", end: "2024-01", mode: "usage" }),
        raw({ kind: "oops" }),
      ],
      new Set(["d:o1"]),
    );
    expect(t.tracks.map((x) => x.label)).toEqual(["Alcool", "Acamprosate"]);
    expect(t.events).toHaveLength(3);
    const med = t.events.find((e) => e.trackId === t.tracks[1].id)!;
    expect(med.end).toBeNull(); // end before start is dropped
    expect(med.mode).toBeNull(); // modes only apply to substance use
  });

  it("merges the same event reported twice", () => {
    const t = assembleTimeline([raw({}), raw({ observation_ids: ["d:o2"] })], new Set(["d:o1", "d:o2"]));
    expect(t.events).toHaveLength(1);
    expect(t.events[0].observationIds).toEqual(["d:o1", "d:o2"]);
  });

  describe("an event the text gives no start for", () => {
    const dates = new Map([["d:o1", "2022-04-05"], ["d:o2", "2022-09-20"]]);
    const known = new Set(dates.keys());
    const noStart = (o: Parameters<typeof raw>[0]) => raw({ kind: "medication", label: "Acamprosate", start: null, mode: null, ...o });

    it("starts at its first mention when it is still going on", () => {
      const t = assembleTimeline([noStart({ ongoing: true, observation_ids: ["d:o2", "d:o1"] })], known, null, null, dates);
      expect(t.events[0]).toMatchObject({ start: "2022-04-05", end: null, ongoing: true, startUnknown: true });
    });

    it("runs from its first mention to its end when it stops later", () => {
      const t = assembleTimeline([noStart({ end: "2022-08" })], known, null, null, dates);
      expect(t.events[0]).toMatchObject({ start: "2022-04-05", end: "2022-08", ongoing: false, startUnknown: true });
    });

    it("is a point at its end when it ended before anyone wrote about it", () => {
      const t = assembleTimeline([noStart({ end: "2017", ongoing: true })], known, null, null, dates);
      expect(t.events[0]).toMatchObject({ start: "2017", end: null, ongoing: false, startUnknown: true });
    });

    it("is dropped when nothing places it: no end, not going on, or no dated source", () => {
      expect(assembleTimeline([noStart({})], known, null, null, dates).events).toEqual([]);
      expect(assembleTimeline([noStart({ ongoing: true })], known, null, null, new Map([["d:o1", null]])).events).toEqual([]);
      // Without the observation dates (older callers), as before.
      expect(assembleTimeline([noStart({ ongoing: true })], known).events).toEqual([]);
    });

    it("leaves a told start alone", () => {
      const t = assembleTimeline([raw({ ongoing: true })], known, null, null, dates);
      expect(t.events[0].start).toBe("2024-04");
      expect(t.events[0].startUnknown).toBeUndefined();
    });
  });
});

describe("timeline building", () => {
  const obs = (id: string, doc: string, date: string, line: number): Observation => ({
    id, doc, date, kind: "IDE", authorRole: null, summary: "",
    start: { page: 0, line }, end: { page: 0, line },
  });
  const docPages = { historique: [page(0, ["Observation IDE du 15/04/2024", "Rechute."])], courrier: [page(0, ["Courrier", "Sortie."])] };
  const event = (ids: string[]) => ({
    kind: "substance_use", label: "Alcool", start: "2024-04", end: null, ongoing: false, mode: "rechute",
    loss_of_control: false, note: "", observation_ids: ids,
  });

  // With a single document, the model shortened "historique:o2" to "o2" in
  // about half the runs, and every event was then dropped for want of a source.
  it("shows the model short ids and maps its answer back to the observations", async () => {
    const seen: { url: string; body: any; headers: any }[] = [];
    const t = await buildTimeline({
      observations: [obs("historique:o1", "historique", "2024-04-15", 1), obs("courrier:o1", "courrier", "2024-05-02", 1)],
      pagesByDoc: docPages,
      manifests: { historique: verified, courrier: verified },
      policy,
      fetchImpl: fakeFetch([{ events: [event(["o1"]), event(["o2", "o9"]), event(["courrier:o1"])].map((e, i) => ({ ...e, start: `2024-0${i + 4}` })) }], seen),
    });
    const sent: string = seen[0].body.messages[1].content;
    expect(sent).toContain("### o1 — 2024-04-15");
    expect(sent).toContain("### o2 — 2024-05-02");
    expect(sent).not.toContain("historique:o1");
    expect(t.events.map((e) => e.observationIds)).toEqual([["historique:o1"], ["courrier:o1"], ["courrier:o1"]]);
  });

  // A recording made before events without a start were placed is replayed
  // as its run went: the frise rebuilt is the one that was scored then.
  it("places an event without a start at its first mention, unless told to drop it as older runs did", async () => {
    const input = () => ({
      observations: [obs("historique:o1", "historique", "2024-04-15", 1)],
      pagesByDoc: docPages,
      manifests: { historique: verified },
      policy,
      fetchImpl: fakeFetch([{ events: [{ ...event(["o1"]), start: null, ongoing: true }] }], []),
    });
    const placed = await buildTimeline(input());
    expect(placed.events).toHaveLength(1);
    expect(placed.events[0]).toMatchObject({ start: "2024-04-15", startUnknown: true });
    const dropped = await buildTimeline({ ...input(), placeUnknownStarts: false });
    expect(dropped.events).toHaveLength(0);
  });
});

describe("response schemas", () => {
  // Strict structured outputs (Anthropic in particular) reject an enum declared
  // under a union type such as ["string", "null"]: such a field must use anyOf.
  function enumsUnderUnionTypes(node: unknown, path = "$"): string[] {
    if (!node || typeof node !== "object") return [];
    const obj = node as Record<string, unknown>;
    const here = "enum" in obj && Array.isArray(obj.type) ? [path] : [];
    return here.concat(Object.entries(obj).flatMap(([k, v]) => enumsUnderUnionTypes(v, `${path}.${k}`)));
  }

  it("never mixes an enum with a union type", () => {
    expect(enumsUnderUnionTypes(TIMELINE_SCHEMA)).toEqual([]);
    expect(enumsUnderUnionTypes(SEGMENT_SCHEMA)).toEqual([]);
  });
});
