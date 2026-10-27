import { describe, expect, it } from "vitest";

import { findNameSpans, trimModelPerson } from "../src/pii/names";
import { buildPageText } from "../src/core/pagetext";
import type { Rect } from "../src/core/types";
import { detectCorpus } from "../src/pii/detect";
import { findRuleSpans, isLuhnValid, isValidNir } from "../src/pii/rules";

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

describe("establishment and record codes", () => {
  it("masks FINESS and SIRET numbers, labelled or checked by their Luhn key", () => {
    expect(isLuhnValid("41200073100015")).toBe(true);
    expect(hits("Finess 12 3 45678 2")).toContainEqual(["ETABLISSEMENT", "12 3 45678 2"]);
    expect(hits("Siret 412 000 731 00015")).toContainEqual(["ETABLISSEMENT", "412 000 731 00015"]);
    expect(hits("12 3 45678 2")).toContainEqual(["ETABLISSEMENT", "12 3 45678 2"]);
    expect(hits("12 3 45678 3")).toEqual([]);
  });

  it("masks postal boxes", () => {
    expect(hits("CS 81234")).toContainEqual(["ADRESSE", "CS 81234"]);
  });

  it("masks long codes without a label but keeps doses", () => {
    expect(hits("B987654321")).toContainEqual(["DOSSIER", "B987654321"]);
    expect(hits("1 000 000 UI de vitamine D, 75 mg x 2")).toEqual([]);
  });

  it("reads the name after a Méd. header field", () => {
    expect(names("Méd. VERCHAMP - Lucie")).toContainEqual(["SOIGNANT", "VERCHAMP"]);
  });
});

describe("form-like headers", () => {
  // The text layer lists the value column before the label column, so the
  // label sits lines away from its value; both share one visual row.
  const word = (text: string, x: number, y: number) => ({ text, rect: [x, y, x + 8 * text.length, y + 10] as Rect });
  const page = buildPageText(0, 600, 800, [
    [word("AB-12345", 120, 100)],
    [word("VERCHAMP", 120, 130)],
    [word("Admission", 10, 101)],
    [word("Méd.", 10, 129)],
    [word("Suivi", 10, 300), word("stable.", 60, 300)],
  ], "pdf");

  it("pairs labels with their values across columns", () => {
    const found = detectCorpus([{ id: "doc", pages: [page] }]).map((d) => [d.category, d.text]);
    expect(found).toContainEqual(["DOSSIER", "AB-12345"]);
    expect(found).toContainEqual(["SOIGNANT", "VERCHAMP"]);
    expect(found.map(([, t]) => t)).not.toContain("Suivi");
  });

  it("does not let an unlabelled rule run on into the next column", () => {
    const twoColumns = buildPageText(0, 600, 800, [
      [word("12", 10, 200), word("rue", 30, 200), word("des", 60, 200), word("Tilleuls", 90, 200)],
      [word("Né(e)", 300, 200), word("le", 350, 200), word("14/06/1978", 370, 200)],
    ], "pdf");
    const found = detectCorpus([{ id: "doc", pages: [twoColumns] }]).map((d) => [d.category, d.text]);
    expect(found).toContainEqual(["NAISSANCE", "14/06/1978"]);
    expect(found.filter(([c, t]) => c === "ADRESSE" && /Né/.test(t))).toEqual([]);
  });

  it("does not run a name on into the next column", () => {
    // Letterhead staff list on the left, the letter on the right, same row.
    const letter = buildPageText(0, 600, 800, [
      [word("Docteur", 10, 200), word("Martine", 74, 200), word("VERCHAMP", 126, 200)],
      [word("Ce", 300, 200), word("patient,", 320, 200), word("vu", 390, 200)],
    ], "pdf");
    const found = detectCorpus([{ id: "doc", pages: [letter] }]).map((d) => d.text);
    expect(found).toContain("Martine VERCHAMP");
    expect(found).not.toContain("Ce");
  });
});

// Shapes that leaked on real documents (names here are invented).
describe("leaks seen on real documents", () => {
  const masked = (text: string) => detectCorpus([{ id: "doc", pages: [buildPageText(0, 600, 800, text.split("\n").map((l) => l.split(" ").map((w, i) => ({ text: w, rect: [i * 40, 0, i * 40 + 30, 10] as Rect }))), "pdf")] }])
    .filter((d) => d.accepted)
    .map((d) => d.text);

  it("reads titles in any case: DR, docteur", () => {
    expect(names("- Adressé au DR Lemarchal décembre 2017")).toContainEqual(["SOIGNANT", "Lemarchal"]);
    expect(names("Monsieur le docteur BERTAUDIN")).toContainEqual(["SOIGNANT", "BERTAUDIN"]);
  });

  it("finds a lawyer after Maître", () => {
    expect(names("appel fait : Maitre DUCASSOU en attente du tribunal")).toContainEqual(["PERSONNE", "DUCASSOU"]);
    expect(names("Maître Ducassou")).toContainEqual(["PERSONNE", "Ducassou"]);
  });

  it("finds an initial followed by an all-caps surname", () => {
    expect(names("Patient suivi par E BERNADOT,")).toContainEqual(["PERSONNE", "BERNADOT"]);
    expect(names("A RAS, J AVEC")).toEqual([]);
    expect(names("NICOTINE 21MG/24H PATCH 4 dispositifs")).toEqual([]);
    expect(names("CARTE DE SÉJOUR A RECUPERER A LA PRÉFECTURE")).toEqual([]);
  });

  it("finds a name followed by a role in brackets", () => {
    expect(names("ou dans trans de TIBURCE (IDE)")).toContainEqual(["SOIGNANT", "TIBURCE"]);
  });

  it("finds the author of a note after its role", () => {
    expect(names("12/03/2024 - IDE - CHAPUIS Hélène")).toContainEqual(["SOIGNANT", "CHAPUIS Hélène"]);
  });

  it("keeps a model name to its own line and never takes a clinical scale for a name", () => {
    const text = "13/03/2024 - Dr LEBRETON\nCushman 3. Poursuite décroissance.";
    const at = (s: string) => ({ start: text.indexOf(s), end: text.indexOf(s) + s.length });
    expect(trimModelPerson(text, at("LEBRETON\nCushman").start, at("LEBRETON\nCushman").end)).toEqual(at("LEBRETON"));
    expect(trimModelPerson(text, at("Cushman").start, at("Cushman").end)).toBeNull();
  });

  it("finds the prescriber at the end of an order line", () => {
    expect(names("Ordonnance de sortie du 12/07/2018 à 18:33 de Nawel BENDRIS")).toContainEqual(["SOIGNANT", "Nawel BENDRIS"]);
    expect(names("sevrage de Valium")).toEqual([]);
  });

  it("finds lowercase names after mme / mlle / mr", () => {
    expect(names("lien avec le SPIP, mme carbonnaz : coordonnées")).toContainEqual(["PERSONNE", "carbonnaz"]);
    expect(names("mme est venue, mr dit que")).toEqual([]);
    expect(names("Mme reviendra avec ses justificatifs, Mr prend son poste")).toEqual([]);
  });

  it("finds addresses without a dot after AV, or without a street number", () => {
    expect(hits("18 AV DES ACACIAS")).toContainEqual(["ADRESSE", "18 AV DES ACACIAS"]);
    expect(hits("RUE DES GLYCINES\n33000 BORDEAUX")).toContainEqual(["ADRESSE", "RUE DES GLYCINES"]);
    expect(hits("dort dans la rue depuis mai")).toEqual([]);
  });

  it("finds the ASI anonymity number, label and value on separate lines", () => {
    expect(hits("ASI N°\n2023151\nN° anonymat")).toContainEqual(["DOSSIER", "2023151"]);
    expect(hits("N° d'anonymat : 2023151")).toContainEqual(["DOSSIER", "2023151"]);
  });

  it("propagates the patient's surname despite a one-letter typo", () => {
    const found = masked("Patient : MARCHANDIEU Sylvie\nNé(e) le 14/06/1978\nnoté AS ' MARCHANDIOU ' sur la fiche");
    expect(found).toContain("MARCHANDIOU");
  });
});

// Shapes that leaked on the fictional dossiers (data/anonymized/dossiers).
describe("leaks seen on the fictional dossiers", () => {
  it("finds a birth name after née, not a word written in capitals", () => {
    expect(names("Patiente : Mme DESMAZURES Corinne, née PELLETIER le 07/09/1972")).toContainEqual(["PERSONNE", "PELLETIER"]);
    expect(names("Née le 07/09/1972 (51 ans)")).toEqual([]);
    expect(names("il ne VEUT pas en parler")).toEqual([]);
    expect(hits("née PELLETIER le 07/09/1972")).toContainEqual(["NAISSANCE", "07/09/1972"]);
  });

  it("reads a record number after a bare N°", () => {
    expect(hits("PEYRAUBE OCEANE   N° 2024-0112")).toContainEqual(["DOSSIER", "2024-0112"]);
    expect(hits("chambre N° 12, lit 2")).toEqual([]);
  });
});

describe("over-masking seen on the fictional dossiers", () => {
  it("names an establishment only up to a capitalised word", () => {
    expect(hits("Suivi : CSAPA du centre hospitalier (Dr LAFFITTE)").filter(([c]) => c === "ETABLISSEMENT")).toEqual([]);
    expect(hits("Hôpital de jour le mardi").filter(([c]) => c === "ETABLISSEMENT")).toEqual([]);
    expect(hits("sevrage à la clinique des Pins, Clinique des Pins")).toContainEqual(["ETABLISSEMENT", "Clinique des Pins"]);
    expect(hits("CENTRE HOSPITALIER FICTIF DU BOIS-JOLI\n")).toContainEqual(["ETABLISSEMENT", "CENTRE HOSPITALIER FICTIF DU BOIS-JOLI"]);
  });

  it("judges the whole word when the model tags part of one", () => {
    const text = "tremblements +, Cushman 7.";
    const start = text.indexOf("ushman");
    expect(trimModelPerson(text, start, start + "ushman".length)).toBeNull();
  });
});
