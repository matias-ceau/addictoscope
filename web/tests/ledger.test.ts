import { beforeEach, describe, expect, it, vi } from "vitest";

import { chatJson } from "../src/cloud/client";
import { CloudRefused, segmentationPolicy, type CloudPolicy } from "../src/cloud/guard";
import { clearLedger, ledgerEntries, realValuesIn } from "../src/cloud/ledger";
import { isReplay, replayFetch, type Recording } from "../src/cloud/replay";
import type { Manifest } from "../src/core/verify";

const manifest: Manifest = {
  tool: "addictoscope",
  formatVersion: 1,
  createdAt: "2026-11-05T00:00:00Z",
  outputSha256: "x",
  pages: 1,
  redactions: {},
  ocrPages: [],
  reviewedByHuman: true,
  verified: true,
  leaks: [],
};
const policy: CloudPolicy = { kind: "openrouter-zdr", apiKey: "sk-test", model: "vendor/model-a" };
const call = (over: Partial<Parameters<typeof chatJson>[0]> = {}) => ({
  policy,
  manifests: [manifest],
  docs: ["doc1"],
  messages: [
    { role: "system" as const, content: "Consigne." },
    {
      role: "user" as const,
      content: [
        { type: "image_url" as const, image_url: { url: "data:image/png;base64,AAAA" } },
        { type: "text" as const, text: "p1 L1 | [PATIENT] vu ce jour" },
      ],
    },
  ],
  schemaName: "segmentation",
  schema: {},
  ...over,
});
const answer = (content: object) =>
  new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }], usage: { cost: 0.0123 } }), { status: 200 });

beforeEach(() => clearLedger());

describe("journal of outbound requests", () => {
  it("records what was sent, where, and what it cost", async () => {
    const fetchImpl = vi.fn(async () => answer({ ok: true })) as unknown as typeof fetch;
    await chatJson(call({ fetchImpl }));
    const [e] = ledgerEntries();
    expect(e).toMatchObject({ status: "ok", destination: "openrouter.ai", replayed: false, zdr: true, model: "vendor/model-a", docs: ["doc1"], cost: 0.0123 });
    expect(e.images).toEqual(["data:image/png;base64,AAAA"]);
    expect(e.text).toContain("[PATIENT] vu ce jour");
    expect(e.text).toContain("Consigne.");
    expect(e.bytes).toBeGreaterThan(50);
    expect(e.endedAt).toBeGreaterThanOrEqual(e.startedAt);
  });

  it("records a refusal by the guard, and nothing is fetched", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    await expect(chatJson(call({ fetchImpl, manifests: [{ ...manifest, verified: false }] }))).rejects.toBeInstanceOf(CloudRefused);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(ledgerEntries()).toMatchObject([{ status: "refused", destination: null, bytes: 0 }]);
  });

  it("records a failed request as an error", async () => {
    const fetchImpl = vi.fn(async () => new Response("rate limited", { status: 429 })) as unknown as typeof fetch;
    await expect(chatJson(call({ fetchImpl }))).rejects.toThrow(/429/);
    expect(ledgerEntries()[0].status).toBe("error");
  });
});

describe("recorded answers", () => {
  const rec: Recording = {
    model: "vendor/model-a",
    cost: 0.1,
    elapsedMs: 1000,
    answers: [
      { schema: "segmentation", content: { n: 1 } },
      { schema: "frise", content: { events: [] } },
      { schema: "segmentation", content: { n: 2 } },
    ],
  };

  it("answers each schema in its recorded order, without the network", async () => {
    const fetchImpl = replayFetch(rec);
    expect(isReplay(fetchImpl)).toBe(true);
    expect(isReplay(fetch)).toBe(false);
    const network = vi.spyOn(globalThis, "fetch");
    expect(await chatJson(call({ fetchImpl }))).toEqual({ n: 1 });
    expect(await chatJson(call({ fetchImpl }))).toEqual({ n: 2 });
    expect(await chatJson(call({ fetchImpl, schemaName: "frise" }))).toEqual({ events: [] });
    expect(network).not.toHaveBeenCalled();
    network.mockRestore();
    expect(ledgerEntries().every((e) => e.replayed && e.destination === null && e.status === "ok")).toBe(true);
  });

  it("still goes through the guard", async () => {
    await expect(chatJson(call({ fetchImpl: replayFetch(rec), manifests: [undefined] }))).rejects.toBeInstanceOf(CloudRefused);
  });

  it("fails clearly when the recording has no answer left", async () => {
    const fetchImpl = replayFetch(rec);
    await chatJson(call({ fetchImpl, schemaName: "frise" }));
    await expect(chatJson(call({ fetchImpl, schemaName: "frise" }))).rejects.toThrow(/404/);
  });
});

describe("real values in an outbound text", () => {
  it("finds whole values as written, across a line break", () => {
    const text = "Vu avec Mme VASSEUR ce jour.\nDomiciliée 33000\nBORDEAUX.";
    expect(realValuesIn(text, ["VASSEUR", "33000 BORDEAUX", "Maëlys"])).toEqual(["VASSEUR", "33000 BORDEAUX"]);
  });

  it("ignores parts of words, other spellings and short values", () => {
    expect(realValuesIn("Le leader du groupe, idées claires.", ["Lea", "Claire", "Le"])).toEqual([]);
  });
});

describe("segmentation model", () => {
  it("uses its own model when one is set, the frise's otherwise", () => {
    expect(segmentationPolicy({ ...policy, segmentModel: "vendor/small" })).toMatchObject({ model: "vendor/small" });
    expect(segmentationPolicy(policy)).toBe(policy);
    expect(segmentationPolicy({ kind: "off" })).toEqual({ kind: "off" });
  });
});
