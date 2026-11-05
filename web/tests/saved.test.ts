import { describe, expect, it } from "vitest";

import { friseHtml } from "../src/app/exportFrise";
import { NotAnAnalysis, parseAnalysis, serializeAnalysis } from "../src/app/saved";
import { encryptKeyfile, decryptKeyfile } from "../src/core/keyfile";
import { keyTableFromEntries, reidentifyTimeline } from "../src/core/reidentify";
import type { Observation, Timeline } from "../src/notebook/model";

// Invented names only.
const observations: Observation[] = [
  {
    id: "doc1:o1",
    doc: "doc1",
    start: { page: 0, line: 3 },
    end: { page: 0, line: 9 },
    date: "2024-03-02",
    kind: "psychiatrique",
    authorRole: null,
    summary: "[PATIENT] vue par [SOIGNANT_1].",
  },
];
const timeline: Timeline = {
  tracks: [{ id: "t1", kind: "substance_use", label: "Alcool" }],
  events: [
    { id: "e1", trackId: "t1", start: "2024-03", end: null, ongoing: true, mode: "usage", lossOfControl: false, note: "[PATIENT] : 6 verres par jour.", observationIds: ["doc1:o1"] },
  ],
  undated: [],
};

describe("saved analysis", () => {
  it("round-trips, pseudonymized, and comes back with the real names from the .axkey", async () => {
    const text = serializeAnalysis({ observations, timeline, model: "vendor/model-a" }, new Date("2026-11-05T10:00:00Z"));
    expect(text).not.toContain("VASSEUR");
    const back = parseAnalysis(text);
    expect(back).toMatchObject({ observations, timeline, model: "vendor/model-a", createdAt: "2026-11-05T10:00:00.000Z", replayed: false });

    const axkey = await encryptKeyfile([{ label: "[PATIENT]", category: "PATIENT", values: ["VASSEUR", "VASSEUR Maëlys"] }], "mot de passe");
    const table = keyTableFromEntries(await decryptKeyfile(axkey, "mot de passe"));
    expect(reidentifyTimeline(back.timeline, table).events[0].note).toBe("VASSEUR Maëlys : 6 verres par jour.");
  });

  it("reads an analysis saved without the undated list", () => {
    const { undated: _, ...older } = timeline;
    const text = serializeAnalysis({ observations, timeline: older as Timeline });
    expect(parseAnalysis(text).timeline.undated).toEqual([]);
  });

  it("refuses other files", () => {
    expect(() => parseAnalysis("not json")).toThrow(NotAnAnalysis);
    expect(() => parseAnalysis(JSON.stringify({ tool: "other" }))).toThrow(NotAnAnalysis);
    expect(() => parseAnalysis(JSON.stringify({ tool: "addictoscope", kind: "analysis", formatVersion: 2 }))).toThrow(/Version/);
    expect(() => parseAnalysis(JSON.stringify({ tool: "addictoscope", kind: "analysis", formatVersion: 1, observations: [] }))).toThrow(
      /incomplète/,
    );
  });
});

describe("frise page export", () => {
  const rows = [{ date: "03/2024 → en cours", kind: "Consommations", color: "var(--kind-substance_use)", track: "Alcool", note: "<b>6</b> verres" }];

  it("says when the page identifies the patient", () => {
    expect(friseHtml({ title: "Frise", meta: "m", identifying: true, svg: "<svg></svg>", rows })).toContain("Contient des données identifiantes");
    expect(friseHtml({ title: "Frise", meta: "m", identifying: false, svg: "<svg></svg>", rows })).toContain("Pseudonymisé");
  });

  it("escapes the text it is given", () => {
    const html = friseHtml({ title: "Frise", meta: "m", identifying: false, svg: "<svg></svg>", rows });
    expect(html).toContain("&lt;b&gt;6&lt;/b&gt; verres");
    expect(html).toContain("<svg></svg>");
  });
});
