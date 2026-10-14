import { describe, expect, it } from "vitest";

import { findNameSpans } from "../src/pii/names";
import { findRuleSpans, isValidNir } from "../src/pii/rules";

const hits = (text: string) => findRuleSpans(text).map((s) => [s.category, text.slice(s.start, s.end)]);
const names = (text: string) => findNameSpans(text).map((s) => [s.category, text.slice(s.start, s.end)]);

describe("rules", () => {
  it("accepts a NIR only when its control key is right", () => {
    expect(isValidNir("2 78 06 33 063 042 44")).toBe(true);
    expect(isValidNir("2 78 06 33 063 042 45")).toBe(false);
    expect(hits("NIR 2 78 06 33 063 042 44 ok")).toContainEqual(["NIR", "2 78 06 33 063 042 44"]);
    expect(hits("NIR 2 78 06 33 063 042 45 ok").filter(([c]) => c === "NIR")).toEqual([]);
  });

  it("finds French phone numbers in their usual spellings", () => {
    for (const tel of ["06 12 34 56 78", "06.12.34.56.78", "0612345678", "+33 6 12 34 56 78"]) {
      expect(hits(`Tel : ${tel}.`)).toContainEqual(["TEL", tel]);
    }
  });

  it("labels the birth date with its year only", () => {
    const [span] = findRuleSpans("Né(e) le 14/06/1978 (46 ans)").filter((s) => s.category === "NAISSANCE");
    expect(span.label).toBe("[NE(E) EN 1978]");
  });

  it("keeps care dates", () => {
    expect(hits("Observation IDE du 15/04/2024 (Urgence : Bas)")).toEqual([]);
  });

  it("finds IPP, admission and folder numbers", () => {
    expect(hits("IPP 0045127893 UFH 4321")).toContainEqual(["IPP", "0045127893"]);
    expect(hits("DUPONT JEAN Admission A999999999 Méd.")).toContainEqual(["DOSSIER", "A999999999"]);
    expect(hits("N° dossier\nD-2024-77812")).toContainEqual(["DOSSIER", "D-2024-77812"]);
  });

  it("finds addresses and cities without crossing lines", () => {
    expect(hits("12 rue des Tilleuls, 33800 BORDEAUX")).toEqual(
      expect.arrayContaining([["ADRESSE", "12 rue des Tilleuls"], ["VILLE", "33800 BORDEAUX"]]),
    );
    expect(hits("N° 77812\nMédecin").filter(([c]) => c === "VILLE")).toEqual([]);
  });
});

describe("names", () => {
  it("guesses roles from context", () => {
    expect(names("Validé par DURAND Pierre - Psychiatre le 03/04/2024")).toContainEqual(["SOIGNANT", "DURAND Pierre"]);
    expect(names("dispute avec sa mère Mme MARCHAND Odette.")).toContainEqual(["PROCHE", "MARCHAND Odette"]);
    expect(names("accompagnée de son frère Thomas.")).toContainEqual(["PROCHE", "Thomas"]);
    expect(names("Le Dr GARNIER a été informé")).toContainEqual(["SOIGNANT", "GARNIER"]);
  });

  it("stops a name at the next non-name word", () => {
    expect(names("MARCHAND SYLVIE Admission A123")).toContainEqual(["PERSONNE", "MARCHAND SYLVIE"]);
    expect(names("CENTRE HOSPITALIER FICTIF")).toEqual([]);
  });

  it("ignores lowercase homonyms of first names", () => {
    expect(names("des idées claires, une pierre")).toEqual([]);
  });
});
