import { fullYear } from "../src/pii/rules";
import { describe, expect, it } from "vitest";

import { birthYearFromDetections, parseAge } from "../src/notebook/age";

describe("parseAge", () => {
  it("reads an exact age, as a number or a numeric string", () => {
    expect(parseAge(14)).toEqual([14, 14]);
    expect(parseAge("14")).toEqual([14, 14]);
    expect(parseAge(0)).toEqual([0, 0]);
    expect(parseAge(110)).toEqual([110, 110]);
  });

  it("reads an inclusive range", () => {
    expect(parseAge([12, 17])).toEqual([12, 17]);
    expect(parseAge([20, 20])).toEqual([20, 20]);
    expect(parseAge([0, 110])).toEqual([0, 110]);
  });

  it("reads the named periods of life", () => {
    expect(parseAge("enfance")).toEqual([6, 11]);
    expect(parseAge("adolescence")).toEqual([12, 17]);
    expect(parseAge("jeune adulte")).toEqual([18, 25]);
  });

  it("ignores case and accents in named periods", () => {
    expect(parseAge("Enfance")).toEqual([6, 11]);
    expect(parseAge("ADOLESCENCE")).toEqual([12, 17]);
    expect(parseAge("Jeune Adulte")).toEqual([18, 25]);
    expect(parseAge("jeûne adulte")).toEqual([18, 25]);
    expect(parseAge("Adolescénce")).toEqual([12, 17]);
  });

  it("refuses ages outside 0..110", () => {
    expect(parseAge(111)).toBeNull();
    expect(parseAge(-1)).toBeNull();
    expect(parseAge("130")).toBeNull();
    expect(parseAge([12, 120])).toBeNull();
    expect(parseAge([-2, 5])).toBeNull();
  });

  it("refuses a reversed range", () => {
    expect(parseAge([17, 12])).toBeNull();
  });

  it("refuses anything unreadable", () => {
    for (const v of [null, undefined, "", "abc", "vieillesse", {}, NaN, ["a", "b"], true]) {
      expect(parseAge(v)).toBeNull();
    }
  });
});

describe("birthYearFromDetections", () => {
  const det = (o: Partial<{ category: string; text: string; label: string; accepted: boolean }>) => ({
    category: "NAISSANCE",
    text: "03/04/1961",
    label: "[NE(E) EN 1961]",
    accepted: true,
    ...o,
  });

  it("reads the year of a full birth date", () => {
    expect(birthYearFromDetections([det({ text: "03/04/1961", label: "[DATE_NAISSANCE]" })])).toBe(1961);
  });

  it("reads a two-digit year", () => {
    expect(birthYearFromDetections([det({ text: "03/04/61", label: "[DATE_NAISSANCE]" })])).toBe(1961);
  });

  it("prefers the original text to the label", () => {
    expect(birthYearFromDetections([det({ text: "03/04/1961", label: "[NE(E) EN 1962]" })])).toBe(1961);
  });

  it("falls back to the year of the label when the text has none", () => {
    expect(birthYearFromDetections([det({ text: "le 3 avril", label: "[NE(E) EN 1972]" })])).toBe(1972);
  });

  it("only uses accepted detections", () => {
    expect(
      birthYearFromDetections([
        det({ text: "01/02/1950", label: "[NE(E) EN 1950]", accepted: false }),
        det({ text: "03/04/1961", label: "[NE(E) EN 1961]" }),
      ]),
    ).toBe(1961);
    expect(birthYearFromDetections([det({ accepted: false })])).toBeNull();
  });

  it("keeps the first accepted NAISSANCE detection", () => {
    expect(
      birthYearFromDetections([
        det({ text: "03/04/1961", label: "[NE(E) EN 1961]" }),
        det({ text: "05/06/1970", label: "[NE(E) EN 1970]" }),
      ]),
    ).toBe(1961);
  });

  it("ignores other categories and returns null without a birth date", () => {
    expect(birthYearFromDetections([])).toBeNull();
    expect(
      birthYearFromDetections([
        det({ category: "DATE", text: "01/01/2000", label: "[DATE_1]" }),
        det({ category: "PATIENT", text: "VASSEUR Maëlys", label: "[PATIENT]" }),
      ]),
    ).toBeNull();
  });
});

describe("two-digit birth years", () => {
  it("are this century up to the current year, the last one otherwise", () => {
    expect(fullYear(61, 2026)).toBe(1961);
    expect(fullYear(8, 2026)).toBe(2008);
    expect(fullYear(26, 2026)).toBe(2026);
    expect(fullYear(27, 2026)).toBe(1927);
  });
});
