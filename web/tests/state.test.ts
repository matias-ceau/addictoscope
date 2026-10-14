import { describe, expect, it } from "vitest";

import type { Category, Detection } from "../src/core/types";
import { mergeDetections, reducer, type AppState } from "../src/ui/state";

let n = 0;
const det = (text: string, category: Category, label: string, entity: string, doc = "a"): Detection => ({
  id: `t${n++}`, doc, page: 0, start: n * 10, end: n * 10 + text.length, text, category, source: "rule", entity, label, rects: [], accepted: true,
});

const start = (): AppState => ({
  docs: [],
  detections: [
    det("Valbrune", "PATIENT", "[PATIENT]", "PATIENT:VALBRUNE"),
    det("Ste Odile", "PERSONNE", "[PERSONNE_1]", "PERSONNE:ODILE"),
    det("Odile", "PERSONNE", "[PERSONNE_1]", "PERSONNE:ODILE"),
    det("Clinique des Aulnes", "ETABLISSEMENT", "[ETABLISSEMENT_1]", "ETABLISSEMENT:AULNES"),
    det("Dr Mervent", "SOIGNANT", "[SOIGNANT_1]", "SOIGNANT:MERVENT"),
    det("Mervent", "PERSONNE", "[PERSONNE_2]", "PERSONNE:MERVENT"),
  ],
});

describe("reviewer corrections", () => {
  it("moves a whole entity to another category with a fresh label", () => {
    const s = reducer(start(), { type: "recategorise", entity: "PERSONNE:ODILE", category: "ETABLISSEMENT" });
    const moved = s.detections.filter((d) => d.origin === "PERSONNE:ODILE");
    expect(moved.map((d) => [d.category, d.label])).toEqual([
      ["ETABLISSEMENT", "[ETABLISSEMENT_2]"],
      ["ETABLISSEMENT", "[ETABLISSEMENT_2]"],
    ]);
  });

  it("joins the existing group of a shared label", () => {
    const s = reducer(start(), { type: "recategorise", entity: "PERSONNE:MERVENT", category: "PATIENT" });
    const patient = s.detections.filter((d) => d.label === "[PATIENT]");
    expect(new Set(patient.map((d) => d.entity))).toEqual(new Set(["PATIENT:VALBRUNE"]));
  });

  it("merges two entities into one pseudonym", () => {
    const s = reducer(start(), { type: "merge", entity: "PERSONNE:MERVENT", into: "SOIGNANT:MERVENT" });
    const merged = s.detections.filter((d) => d.text.includes("Mervent"));
    expect(merged.map((d) => [d.category, d.label, d.entity])).toEqual([
      ["SOIGNANT", "[SOIGNANT_1]", "SOIGNANT:MERVENT"],
      ["SOIGNANT", "[SOIGNANT_1]", "SOIGNANT:MERVENT"],
    ]);
  });

  it("chains corrections and keeps them when detection runs again", () => {
    let s = reducer(start(), { type: "merge", entity: "PERSONNE:MERVENT", into: "SOIGNANT:MERVENT" });
    s = reducer(s, { type: "recategorise", entity: "SOIGNANT:MERVENT", category: "PROCHE" });
    expect(new Set(s.detections.filter((d) => d.text.includes("Mervent")).map((d) => d.label))).toEqual(new Set(["[PROCHE_1]"]));

    // A new document arrives: detection is recomputed from scratch.
    const fresh = [...start().detections, det("Mervent", "PERSONNE", "[PERSONNE_2]", "PERSONNE:MERVENT", "b")];
    s = reducer(s, { type: "detections", detections: mergeDetections(s.detections, fresh) });
    expect(s.detections.filter((d) => d.text.includes("Mervent")).map((d) => d.label)).toEqual(["[PROCHE_1]", "[PROCHE_1]", "[PROCHE_1]"]);
  });
});
