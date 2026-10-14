import { describe, expect, it } from "vitest";

import { chatJson } from "../src/cloud/client";
import { CloudRefused, type CloudPolicy } from "../src/cloud/guard";
import type { PageText } from "../src/core/types";
import type { Manifest } from "../src/core/verify";
import { repeatedLines } from "../src/notebook/lines";
import { assembleTimeline } from "../src/notebook/timeline";
import { repairObservations, segmentDocument } from "../src/notebook/segment";

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
});
