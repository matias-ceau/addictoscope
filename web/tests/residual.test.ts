import { describe, expect, it } from "vitest";

import { findNameSpans } from "../src/pii/names";
import { findRuleSpans } from "../src/pii/rules";

const names = (text: string) => findNameSpans(text).map((s) => text.slice(s.start, s.end));
const rules = (text: string) => findRuleSpans(text).map((s) => [s.category, text.slice(s.start, s.end)]);

// Shapes left readable in real notes, rebuilt here with invented names.
describe("names and numbers that slipped through in real notes", () => {
  it("finds a doctor's name written on the line after the title", () => {
    expect(names("ordonnance de son médecin habituel (Dr\nGarnier à Talence), faite en attendant")).toContain("Garnier");
  });

  it("finds a name that starts with a particle after an upper-case title", () => {
    expect(names("DR Le GARNIER à Cadillac aurait évoqué un trouble")).toContain("Le GARNIER");
  });

  it("finds a name glued to its title", () => {
    expect(names("accompagnée d'un ami M.Vasseur ce week-end")).toContain("Vasseur");
  });

  it("finds a name given by its initial and its surname in a parenthesis", () => {
    expect(names("sur orientation de l'unité (H. Vasseur) avec projet d'hospitalisation")).toContain("H. Vasseur");
  });

  it("does not take a clinical abbreviation for the author of an act", () => {
    expect(names("TS par IMV et alcool, admise aux urgences")).toEqual([]);
  });

  it("masks an account name made of a first name and a date", () => {
    expect(rules("compte ouvert : Camille010203")).toContainEqual(["DOSSIER", "Camille010203"]);
    expect(rules("lot AB123456 du vaccin").filter(([, t]) => t.includes("123456"))).toEqual([]);
  });

  it("finds a phone number written with slashes", () => {
    expect(rules("DRH de la mairie : 05/56/01/02/03")).toContainEqual(["TEL", "05/56/01/02/03"]);
    // A date is not a phone number.
    expect(rules("vu le 05/06/2023").filter(([c]) => c === "TEL")).toEqual([]);
    expect(rules("08/07/2025 10:08 : Observation de suivi").filter(([c]) => c === "TEL")).toEqual([]);
  });
});
