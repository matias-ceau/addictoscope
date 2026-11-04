import { describe, expect, it } from "vitest";

import type { KeyEntry } from "../src/core/keyfile";
import {
  keyTableFromDetections,
  keyTableFromEntries,
  reidentify,
  reidentifyTimeline,
  type KeyTable,
} from "../src/core/reidentify";
import type { Category, Detection } from "../src/core/types";
import type { Timeline } from "../src/notebook/model";

let n = 0;
const det = (label: string, text: string, category: Category, accepted = true): Detection => ({
  id: `d${++n}`,
  doc: "historique",
  page: 0,
  start: 0,
  end: text.length,
  text,
  category,
  source: "rule",
  entity: label,
  label,
  rects: [],
  accepted,
});

describe("keyTableFromDetections", () => {
  it("maps each label to its most complete value", () => {
    const table = keyTableFromDetections([
      det("[SOIGNANT_2]", "LEROY", "SOIGNANT"),
      det("[SOIGNANT_2]", "LEROY Martine", "SOIGNANT"),
      det("[SOIGNANT_2]", "Leroy", "SOIGNANT"),
      det("[PATIENT]", "VASSEUR Maëlys", "PATIENT"),
      det("[PATIENT]", "Maëlys", "PATIENT"),
    ]);
    expect(table.get("[SOIGNANT_2]")).toBe("LEROY Martine");
    expect(table.get("[PATIENT]")).toBe("VASSEUR Maëlys");
    expect(table.size).toBe(2);
  });

  it("counts words first, then length, then keeps the first seen", () => {
    const table = keyTableFromDetections([
      det("[PROCHE_1]", "Maximiliennette", "PROCHE"),
      det("[PROCHE_1]", "Li Bo", "PROCHE"),
      det("[SOIGNANT_1]", "M. GARNIER", "SOIGNANT"),
      det("[SOIGNANT_1]", "Odilon GARNIER", "SOIGNANT"),
      det("[SOIGNANT_3]", "DURAND Léa", "SOIGNANT"),
      det("[SOIGNANT_3]", "LÉA Durand", "SOIGNANT"),
    ]);
    expect(table.get("[PROCHE_1]")).toBe("Li Bo");
    expect(table.get("[SOIGNANT_1]")).toBe("Odilon GARNIER");
    expect(table.get("[SOIGNANT_3]")).toBe("DURAND Léa");
  });

  it("only uses accepted detections", () => {
    const table = keyTableFromDetections([
      det("[SOIGNANT_2]", "LEROY", "SOIGNANT"),
      det("[SOIGNANT_2]", "LEROY Martine Odette", "SOIGNANT", false),
      det("[PROCHE_4]", "BRUNEL Anatole", "PROCHE", false),
    ]);
    expect(table.get("[SOIGNANT_2]")).toBe("LEROY");
    expect(table.has("[PROCHE_4]")).toBe(false);
  });

  it("returns an empty table without detections", () => {
    expect(keyTableFromDetections([]).size).toBe(0);
  });
});

describe("keyTableFromEntries", () => {
  it("applies the same choice among the values of a key file", () => {
    const entries: KeyEntry[] = [
      { label: "[SOIGNANT_2]", category: "SOIGNANT", values: ["LEROY", "LEROY Martine", "Leroy"] },
      { label: "[PATIENT]", category: "PATIENT", values: ["VASSEUR Maëlys"] },
      { label: "[PROCHE_1]", category: "PROCHE", values: ["Maximiliennette", "Li Bo"] },
      { label: "[SOIGNANT_3]", category: "SOIGNANT", values: ["DURAND Léa", "LÉA Durand"] },
      { label: "[NE(E) EN 1961]", category: "NAISSANCE", values: ["03/04/1961"] },
    ];
    const table = keyTableFromEntries(entries);
    expect(table.get("[SOIGNANT_2]")).toBe("LEROY Martine");
    expect(table.get("[PATIENT]")).toBe("VASSEUR Maëlys");
    expect(table.get("[PROCHE_1]")).toBe("Li Bo");
    expect(table.get("[SOIGNANT_3]")).toBe("DURAND Léa");
    expect(table.get("[NE(E) EN 1961]")).toBe("03/04/1961");
    expect(table.size).toBe(5);
  });
});

describe("reidentify", () => {
  const table: KeyTable = new Map([
    ["[PATIENT]", "VASSEUR Maëlys"],
    ["[SOIGNANT_1]", "GARNIER Odilon"],
    ["[SOIGNANT_12]", "PELLETIER Aurore"],
    ["[NE(E) EN 1961]", "03/04/1961"],
  ]);

  it("replaces several labels", () => {
    expect(reidentify("[PATIENT] vue par [SOIGNANT_1].", table)).toBe("VASSEUR Maëlys vue par GARNIER Odilon.");
  });

  it("replaces every occurrence of a label", () => {
    expect(reidentify("[PATIENT] [PATIENT] et encore [PATIENT]", table)).toBe(
      "VASSEUR Maëlys VASSEUR Maëlys et encore VASSEUR Maëlys",
    );
  });

  it("keeps the labels it does not know", () => {
    expect(reidentify("Appel de [PROCHE_3] à [SOIGNANT_9].", table)).toBe("Appel de [PROCHE_3] à [SOIGNANT_9].");
    expect(reidentify("[PATIENT] et [PROCHE_3]", table)).toBe("VASSEUR Maëlys et [PROCHE_3]");
  });

  it("handles labels with digits and with parentheses", () => {
    expect(reidentify("[SOIGNANT_12] remplace [SOIGNANT_1].", table)).toBe("PELLETIER Aurore remplace GARNIER Odilon.");
    expect(reidentify("[PATIENT] [NE(E) EN 1961], 63 ans", table)).toBe("VASSEUR Maëlys 03/04/1961, 63 ans");
  });

  it("leaves text untouched with an empty table or no label", () => {
    expect(reidentify("[PATIENT] seul.", new Map())).toBe("[PATIENT] seul.");
    expect(reidentify("Rien à remplacer.", table)).toBe("Rien à remplacer.");
  });
});

describe("reidentifyTimeline", () => {
  const table: KeyTable = new Map([
    ["[PATIENT]", "VASSEUR Maëlys"],
    ["[PROCHE_1]", "BRUNEL Anatole"],
    ["[SOIGNANT_2]", "LEROY Martine"],
  ]);
  const timeline = (): Timeline => ({
    tracks: [
      { id: "t1", kind: "substance_use", label: "Alcool" },
      { id: "t2", kind: "life_event", label: "Rupture avec [PROCHE_1]" },
      { id: "t3", kind: "therapeutic_psycho", label: "Suivi par [SOIGNANT_2]" },
    ],
    events: [
      {
        id: "e1", trackId: "t2", start: "2019-03", end: null, ongoing: false, mode: null, lossOfControl: false,
        note: "[PATIENT] quitte [PROCHE_1].", observationIds: ["historique:o1"],
      },
      {
        id: "e2", trackId: "t3", start: "2020", end: "2022-06-15", ongoing: false, mode: null, lossOfControl: false,
        note: "Suivi par [SOIGNANT_2], puis [SOIGNANT_7].", observationIds: ["historique:o2", "courrier:o1"],
      },
      {
        id: "e3", trackId: "t1", start: "1976", end: "1979", ongoing: false, mode: "usage", lossOfControl: true,
        note: "[PATIENT] boit à l'adolescence.", observationIds: ["historique:o3"],
        fromAge: { start: [12, 17], end: null },
      },
    ],
    undated: [
      {
        id: "e4", trackId: "t1", ongoing: false, mode: "usage", lossOfControl: false,
        note: "[PATIENT] boit avec [PROCHE_1] à 14 ans.", observationIds: ["historique:o3"],
        startAge: [14, 14], endAge: null,
      },
    ],
  });

  it("re-identifies notes, track labels and undated notes", () => {
    const out = reidentifyTimeline(timeline(), table);
    expect(out.tracks.map((t) => t.label)).toEqual(["Alcool", "Rupture avec BRUNEL Anatole", "Suivi par LEROY Martine"]);
    expect(out.events.map((e) => e.note)).toEqual([
      "VASSEUR Maëlys quitte BRUNEL Anatole.",
      "Suivi par LEROY Martine, puis [SOIGNANT_7].",
      "VASSEUR Maëlys boit à l'adolescence.",
    ]);
    expect(out.undated.map((e) => e.note)).toEqual(["VASSEUR Maëlys boit avec BRUNEL Anatole à 14 ans."]);
  });

  it("leaves ids, dates, ages and sources untouched", () => {
    const before = timeline();
    const out = reidentifyTimeline(before, table);
    const strip = (t: Timeline) => ({
      tracks: t.tracks.map(({ label: _l, ...rest }) => rest),
      events: t.events.map(({ note: _n, ...rest }) => rest),
      undated: t.undated.map(({ note: _n, ...rest }) => rest),
    });
    expect(strip(out)).toEqual(strip(before));
  });

  it("does not mutate its input", () => {
    const input = timeline();
    const copy = structuredClone(input);
    reidentifyTimeline(input, table);
    expect(input).toEqual(copy);
  });
});

describe("labels shared by different values", () => {
  it("stay labels rather than show one value for another", () => {
    const table = keyTableFromDetections([
      det("[TEL]", "06 12 34 56 78", "TEL"),
      det("[TEL]", "05 56 00 11 22", "TEL"),
      det("[SOIGNANT_1]", "VASSEUR", "SOIGNANT"),
      det("[SOIGNANT_1]", "VASSEUR Maëlys", "SOIGNANT"),
    ]);
    expect(table.has("[TEL]")).toBe(false);
    expect(table.get("[SOIGNANT_1]")).toBe("VASSEUR Maëlys");
    expect(reidentify("Rappeler au [TEL] ([SOIGNANT_1]).", table)).toBe("Rappeler au [TEL] (VASSEUR Maëlys).");
  });
});
