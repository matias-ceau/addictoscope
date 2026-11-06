import { describe, expect, it } from "vitest";

import { libraryUrl, NotALibrary, parseKeyTable, parseLibrary, remapAnalysis } from "../src/app/library";
import type { SavedAnalysis } from "../src/app/saved";
import type { Observation } from "../src/notebook/model";
import { groupObservations } from "../src/notebook/observations";

const BASE = "http://localhost/lib/library.json";
const dossier = (o: Record<string, unknown> = {}) => ({
  slug: "alcool-depression",
  title: "Alcool et dépression",
  summary: "Femme de 50 ans.",
  docs: [{ file: "alcool-depression/historique.pdf", title: "Historique" }],
  analysis: "alcool-depression/analysis.json",
  ...o,
});
const lib = (dossiers: unknown[], extra: Record<string, unknown> = {}) =>
  JSON.stringify({ title: "Dossiers fictifs", groups: [{ title: "Dossiers fictifs", dossiers }], ...extra });

describe("parseLibrary", () => {
  it("reads groups and dossiers, the document id defaulting to the file name", () => {
    const l = parseLibrary(lib([dossier({ key: "alcool-depression/key.json", cost: 0.4, events: 31 })]), BASE);
    expect(l.title).toBe("Dossiers fictifs");
    const d = l.groups[0].dossiers[0];
    expect(d.docs).toEqual([{ file: "alcool-depression/historique.pdf", id: "historique", title: "Historique" }]);
    expect(d).toMatchObject({ key: "alcool-depression/key.json", cost: 0.4, events: 31 });
    expect(libraryUrl(l, d.analysis)).toBe("http://localhost/lib/alcool-depression/analysis.json");
  });

  it("keeps an explicit document id", () => {
    const l = parseLibrary(lib([dossier({ docs: [{ file: "x/hist.docx", id: "historique-word" }] })]), BASE);
    expect(l.groups[0].dossiers[0].docs[0]).toMatchObject({ id: "historique-word", title: "hist" });
  });

  it.each([
    ["not JSON", "{"],
    ["no groups", JSON.stringify({ title: "x" })],
    ["no dossier", lib([])],
    ["a dossier without documents", lib([dossier({ docs: [] })])],
    ["a dossier without analysis", lib([dossier({ analysis: undefined })])],
    ["two dossiers with one slug", lib([dossier(), dossier()])],
    ["a path out of the folder", lib([dossier({ analysis: "../secret.json" })])],
    ["an absolute path", lib([dossier({ docs: [{ file: "/etc/passwd" }] })])],
    ["a URL", lib([dossier({ key: "https://example.org/key.json" })])],
  ])("refuses %s", (_, text) => {
    expect(() => parseLibrary(text, BASE)).toThrow(NotALibrary);
  });
});

const obs = (id: string, doc: string, date: string | null, page = 0, line = 1): Observation => ({
  id, doc, date, kind: "suivi", authorRole: null, summary: "", start: { page, line }, end: { page, line: line + 1 },
});

describe("remapAnalysis", () => {
  it("moves observations to this session's documents, leaving unknown ones as they are", () => {
    const saved: SavedAnalysis = {
      observations: [obs("historique:o1", "historique", "2024-01-01"), obs("asi:o1", "asi", null)],
      timeline: { tracks: [], events: [], undated: [] },
      createdAt: "",
    };
    const r = remapAnalysis(saved, { historique: "doc7" });
    expect(r.observations.map((o) => [o.id, o.doc])).toEqual([["historique:o1", "doc7"], ["asi:o1", "asi"]]);
    expect(saved.observations[0].doc).toBe("historique");
  });
});

describe("parseKeyTable", () => {
  it("reads labels, ignores anything else", () => {
    expect(parseKeyTable(JSON.stringify({ labels: { "[PATIENT 1]": "Jeanne Martin", bad: 3 } }))).toEqual(new Map([["[PATIENT 1]", "Jeanne Martin"]]));
    expect(parseKeyTable("{")).toBeUndefined();
    expect(parseKeyTable(JSON.stringify({ labels: {} }))).toBeUndefined();
  });
});

describe("groupObservations", () => {
  it("groups by document in source order, each in chronological order, undated last", () => {
    const g = groupObservations(
      [obs("b:1", "b", "2023-05"), obs("a:2", "a", null, 0, 9), obs("a:1", "a", "2024-02-01"), obs("a:3", "a", "2021"), obs("a:4", "a", null, 0, 2)],
      ["a", "b"],
    );
    expect(g.map((x) => x.doc)).toEqual(["a", "b"]);
    expect(g[0].observations.map((o) => o.id)).toEqual(["a:3", "a:1", "a:4", "a:2"]);
  });

  it("puts documents missing from the order last", () => {
    expect(groupObservations([obs("z:1", "z", null), obs("a:1", "a", null)], ["a"]).map((x) => x.doc)).toEqual(["a", "z"]);
  });
});
