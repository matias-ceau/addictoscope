/**
 * Antecedents told by age ("à 14 ans", "à l'adolescence"): the model returns
 * the age, and the year is computed here, from a birth year that never
 * leaves the browser.
 */

/** Inclusive range of ages in years, e.g. [14, 14] or [12, 17]. */
import { fullYear } from "../pii/rules";
export type AgeRange = [number, number];

export const MAX_AGE = 110;

/** Named life periods, as the prompt defines them. */
export const AGE_PERIODS: Record<string, AgeRange> = {
  enfance: [6, 11],
  adolescence: [12, 17],
  "jeune adulte": [18, 25],
};

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function range(a: number, b: number): AgeRange | null {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (a < 0 || b > MAX_AGE || a > b) return null;
  return [a, b];
}

function ageNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? Math.floor(v) : null;
  if (typeof v === "string" && /^\s*\d{1,3}\s*$/.test(v)) return Number(v);
  return null;
}

/** 14 | "14" -> [14,14]; [12,17] -> [12,17]; "enfance" -> [6,11];
 *  "adolescence" -> [12,17]; "jeune adulte" -> [18,25] (accents and case
 *  ignored). Out of 0..110, reversed or unreadable -> null. */
export function parseAge(v: unknown): AgeRange | null {
  const n = ageNumber(v);
  if (n !== null) return range(n, n);
  if (Array.isArray(v)) {
    if (v.length === 0 || v.length > 2) return null;
    const a = ageNumber(v[0]);
    const b = ageNumber(v[v.length - 1]);
    return a === null || b === null ? null : range(a, b);
  }
  if (typeof v !== "string") return null;
  const s = fold(v);
  if (s in AGE_PERIODS) return AGE_PERIODS[s];
  // A few wordings the model may still write: "a l adolescence", "14 ans",
  // "vers 20 ans", "12-17", "entre 12 et 17 ans".
  const period = Object.keys(AGE_PERIODS).find((p) => new RegExp(`(^| )${p}$`).test(s));
  if (period) return AGE_PERIODS[period];
  const about = /^(?:a |des |depuis )?(?:vers|environ|autour de) (\d{1,3})(?: ans)?$/.exec(s);
  if (about) return range(Number(about[1]) - 1, Number(about[1]) + 1);
  const exact = /^(?:a |des |depuis (?:l age de )?)?(\d{1,3}) ans$/.exec(s);
  if (exact) return range(Number(exact[1]), Number(exact[1]));
  const between = /^(?:entre )?(\d{1,3}) ?(?:-|a|et) ?(\d{1,3})(?: ans)?$/.exec(s);
  if (between) return range(Number(between[1]), Number(between[2]));
  return null;
}

/** "03/04/1961", "3.4.61" -> 1961, "3.4.08" -> 2008. */
function yearOfDate(text: string): number | null {
  const m = /(?:^|\D)\d{1,2}[/.-]\d{1,2}[/.-](\d{4}|\d{2})(?!\d)/.exec(text);
  if (!m) return null;
  return m[1].length === 4 ? Number(m[1]) : fullYear(Number(m[1]));
}

/** Birth year known locally: the NAISSANCE detection's original text
 *  ("03/04/1961", "03/04/61" -> 1961), else its label "[NE(E) EN 1961]";
 *  the first accepted NAISSANCE detection wins; none -> null. */
export function birthYearFromDetections(
  dets: { category: string; text: string; label: string; accepted: boolean }[],
): number | null {
  for (const d of dets) {
    if (!d.accepted || d.category !== "NAISSANCE") continue;
    const fromLabel = /\[NE\(E\) EN (\d{4})\]/.exec(d.label);
    const year = yearOfDate(d.text) ?? (fromLabel ? Number(fromLabel[1]) : null);
    if (year !== null) return year;
  }
  return null;
}

/** "14 ans", "entre 12 et 17 ans". */
export function formatAge(a: AgeRange): string {
  return a[0] === a[1] ? `${a[0]} ans` : `entre ${a[0]} et ${a[1]} ans`;
}
