import { describe, expect, it } from "vitest";

import type { CloudPolicy } from "../src/cloud/guard";
import { CloudRefused } from "../src/cloud/guard";
import type { PageText } from "../src/core/types";
import type { Manifest } from "../src/core/verify";
import { buildConsensusTimeline, groupEvents } from "../src/notebook/consensus";
import type { Observation } from "../src/notebook/model";
import type { RawEvent } from "../src/notebook/timeline";

const ev = (o: Partial<RawEvent> & Record<string, unknown>): RawEvent => ({
  kind: "substance_use",
  label: "Alcool",
  start: "2020",
  end: null,
  start_age: null,
  end_age: null,
  ongoing: false,
  mode: "usage",
  loss_of_control: false,
  note: "",
  observation_ids: ["h:o1"],
  ...o,
}) as RawEvent;

describe("groupEvents", () => {
  it("agrees on the same event read twice", () => {
    const g = groupEvents([[ev({})], [ev({ label: "alcool", note: "autre formulation" })]]);
    expect(g).toHaveLength(1);
    expect(g[0].agreed).toBe(true);
    expect(g[0].members.every(Boolean)).toBe(true);
  });

  it("agrees across precisions, the most precise date kept on merge", () => {
    const g = groupEvents([[ev({ start: "2020" })], [ev({ start: "2020-03-14" })]]);
    expect(g).toHaveLength(1);
    expect(g[0].agreed).toBe(true);
  });

  it("disputes incompatible dates on the same source", () => {
    const g = groupEvents([[ev({ start: "2020" })], [ev({ start: "2015" })]]);
    expect(g).toHaveLength(1);
    expect(g[0].agreed).toBe(false);
    expect(g[0].members.every(Boolean)).toBe(true);
  });

  it("disputes an event only one reading has", () => {
    const g = groupEvents([[ev({}), ev({ label: "Cannabis", observation_ids: ["h:o2"] })], [ev({})]]);
    expect(g).toHaveLength(2);
    const lone = g.find((x) => x.members[0]?.label === "Cannabis")!;
    expect(lone.agreed).toBe(false);
    expect(lone.members[1]).toBeNull();
  });

  it("disputes the same label filed under two tracks", () => {
    const g = groupEvents([
      [ev({ kind: "therapeutic_psycho", label: "Sevrage hospitalier", mode: null })],
      [ev({ kind: "medication", label: "Sevrage hospitalier", mode: null })],
    ]);
    expect(g).toHaveLength(1);
    expect(g[0].agreed).toBe(false);
  });

  it("never puts two events of one reading in a group", () => {
    const g = groupEvents([[ev({}), ev({ start: "2020-06" })], [ev({})]]);
    for (const x of g) expect(x.members.filter(Boolean).length).toBeLessThanOrEqual(2);
    expect(g).toHaveLength(2);
  });

  it("compares antecedents told by age on their age", () => {
    const g = groupEvents([
      [ev({ start: null, start_age: 15 })],
      [ev({ start: null, start_age: [14, 16] })],
    ]);
    expect(g).toHaveLength(1);
    expect(g[0].agreed).toBe(true);
    const h = groupEvents([[ev({ start: null, start_age: 15 })], [ev({ start: null, start_age: 30 })]]);
    expect(h.some((x) => x.agreed)).toBe(false);
  });

  it("keeps different modes of one substance apart", () => {
    const g = groupEvents([
      [ev({ mode: "usage" }), ev({ mode: "sevrage" })],
      [ev({ mode: "sevrage" }), ev({ mode: "usage" })],
    ]);
    expect(g).toHaveLength(2);
    expect(g.every((x) => x.agreed)).toBe(true);
  });

  it("agrees across three readings only when all three have it", () => {
    const g = groupEvents([[ev({})], [ev({})], []]);
    expect(g).toHaveLength(1);
    expect(g[0].agreed).toBe(false);
  });
});

const verified = { verified: true, reviewedByHuman: true, leaks: [] } as unknown as Manifest;
const page = (i: number, lines: string[]): PageText => ({
  page: i, width: 1, height: 1, text: lines.join("\n") + "\n", words: [], source: "pdf",
});
const obs = (id: string, date: string, line: number): Observation => ({
  id, doc: "historique", date, kind: "médicale", authorRole: null, summary: "",
  start: { page: 0, line }, end: { page: 0, line: line + 1 },
});
const observations = [obs("historique:o1", "2024-01-10", 1), obs("historique:o2", "2024-02-11", 3), obs("historique:o3", "2024-03-12", 5)];
const pagesByDoc = {
  historique: [
    page(0, [
      "Observation du 10/01/2024",
      "ALPHA alcool quotidien depuis 2020.",
      "Observation du 11/02/2024",
      "BRAVO cannabis le week-end.",
      "Observation du 12/03/2024",
      "CHARLIE rien de neuf.",
    ]),
  ],
};
const reader = (model: string): CloudPolicy => ({ kind: "openrouter-zdr", apiKey: "sk-test", model });

type Call = { model: string; schema: string; user: string };
/** Answers by model id; the arbiter gets `arbiter(user text)`. */
function fakeFetch(answers: Record<string, unknown>, calls: Call[]) {
  return (async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    const user = body.messages.find((m: { role: string }) => m.role === "user").content as string;
    calls.push({ model: body.model, schema: body.response_format.json_schema.name, user });
    const a = answers[body.model];
    const content = typeof a === "function" ? a(user) : a;
    return new Response(JSON.stringify({ choices: [{ message: { content: content === "" ? "" : JSON.stringify(content) } }] }), {
      status: 200,
    });
  }) as unknown as typeof fetch;
}
const short = (o: Partial<RawEvent> & Record<string, unknown>) => ev({ observation_ids: ["o1"], ...o });
const alcohol = short({ note: "Alcool quotidien." });
const cannabis = short({ label: "Cannabis", start: "2024", observation_ids: ["o2"], note: "Cannabis." });

const run = (answers: Record<string, unknown>, calls: Call[], manifest: Manifest | undefined = verified) =>
  buildConsensusTimeline({
    observations,
    pagesByDoc,
    manifests: { historique: manifest },
    policy: reader("a/reader-1"),
    consensus: { readers: [reader("a/reader-1"), reader("b/reader-2")], arbiter: reader("c/arbiter") },
    fetchImpl: fakeFetch(answers, calls),
  });

describe("buildConsensusTimeline", () => {
  it("keeps agreements without asking the arbiter", async () => {
    const calls: Call[] = [];
    const t = await run({ "a/reader-1": { events: [alcohol] }, "b/reader-2": { events: [alcohol] } }, calls);
    expect(calls.map((c) => c.model).sort()).toEqual(["a/reader-1", "b/reader-2"]);
    expect(t.events).toHaveLength(1);
    expect(t.consensus).toMatchObject({ readers: 2, agreed: 1, disputed: 0, kept: 0, dropped: 0, unarbitrated: 0 });
  });

  it("sends the arbiter only the observations its disputes cite", async () => {
    const calls: Call[] = [];
    await run(
      {
        "a/reader-1": { events: [alcohol, cannabis] },
        "b/reader-2": { events: [alcohol] },
        "c/arbiter": { decisions: [{ id: "d1", verdict: "keep", event: null }] },
      },
      calls,
    );
    const arb = calls.find((c) => c.model === "c/arbiter")!;
    expect(arb.schema).toBe("arbitrage");
    expect(arb.user).toContain("BRAVO");
    expect(arb.user).not.toContain("ALPHA");
    expect(arb.user).not.toContain("CHARLIE");
  });

  it("drops what the arbiter drops, replaces what it corrects", async () => {
    const calls: Call[] = [];
    const t = await run(
      {
        "a/reader-1": { events: [alcohol, cannabis, short({ label: "Tabac", observation_ids: ["o3"] })] },
        "b/reader-2": { events: [alcohol] },
        "c/arbiter": (user: string) => ({
          // One dispute per line: {"id":"d1","variants":[…]}.
          decisions: user
            .split("\n")
            .filter((l) => l.startsWith('{"id"'))
            .map((l) => JSON.parse(l))
            .map((d: { id: string; variants: RawEvent[] }) =>
              d.variants.some((v) => v.label === "Cannabis")
                ? { id: d.id, verdict: "keep", event: { ...cannabis, start: "2024-02", note: "Corrigé." } }
                : { id: d.id, verdict: "drop", event: null },
            ),
        }),
      },
      calls,
    );
    expect(t.events.map((e) => e.note).sort()).toEqual(["Alcool quotidien.", "Corrigé."]);
    expect(t.events.find((e) => e.note === "Corrigé.")).toMatchObject({ start: "2024-02", consensus: "arbitrated" });
    expect(t.events.find((e) => e.note === "Alcool quotidien.")?.consensus).toBe("agreed");
    expect(t.consensus).toMatchObject({ agreed: 1, disputed: 2, kept: 1, dropped: 1, unarbitrated: 0 });
  });

  it("keeps disputes unarbitrated when the arbiter answers nothing usable", async () => {
    const calls: Call[] = [];
    const t = await run(
      { "a/reader-1": { events: [alcohol, cannabis] }, "b/reader-2": { events: [alcohol] }, "c/arbiter": "" },
      calls,
    );
    expect(t.events).toHaveLength(2);
    expect(t.consensus).toMatchObject({ disputed: 1, unarbitrated: 1, kept: 0, dropped: 0 });
    expect(t.events.find((e) => e.note === "Cannabis.")?.consensus).toBe("unarbitrated");
  });

  it("keeps the variant the arbiter points to", async () => {
    const t = await run(
      {
        "a/reader-1": { events: [short({ start: "2020", note: "Lecture 1." })] },
        "b/reader-2": { events: [short({ start: "2015", note: "Lecture 2." })] },
        "c/arbiter": { decisions: [{ id: "d1", verdict: "keep", variant: 2, event: null }] },
      },
      [],
    );
    expect(t.events.map((e) => [e.start, e.note])).toEqual([["2015", "Lecture 2."]]);
    expect(t.consensus).toMatchObject({ disputed: 1, kept: 1 });
  });

  it("keeps a dispute the arbiter forgot", async () => {
    const t = await run(
      { "a/reader-1": { events: [alcohol, cannabis] }, "b/reader-2": { events: [alcohol] }, "c/arbiter": { decisions: [] } },
      [],
    );
    expect(t.consensus.unarbitrated).toBe(1);
    expect(t.events).toHaveLength(2);
  });

  it("refuses everything when a document is not verified", async () => {
    const calls: Call[] = [];
    await expect(
      run({ "a/reader-1": { events: [alcohol] }, "b/reader-2": { events: [alcohol] } }, calls, { ...verified, verified: false } as Manifest),
    ).rejects.toBeInstanceOf(CloudRefused);
    expect(calls).toEqual([]);
  });
});

describe("consensusPolicies", () => {
  it("derives the readers and the arbiter from the settings, or nothing for one model", async () => {
    const { consensusPolicies } = await import("../src/cloud/guard");
    const base = reader("x/main");
    expect(consensusPolicies(base)).toBeNull();
    expect(consensusPolicies({ ...base, consensus: { readers: ["a/1"], arbiter: "c/3" } } as CloudPolicy)).toBeNull();
    const c = consensusPolicies({ ...base, consensus: { readers: ["a/1", "b/2"], arbiter: "c/3" } } as CloudPolicy)!;
    expect(c.readers.map((p) => (p.kind === "off" ? "" : p.model))).toEqual(["a/1", "b/2"]);
    expect(c.arbiter).toMatchObject({ kind: "openrouter-zdr", model: "c/3", apiKey: "sk-test" });
  });
});
