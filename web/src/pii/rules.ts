/**
 * Pattern rules for identifiers with a recognisable shape. Each rule returns
 * raw spans; names are handled separately in names.ts.
 *
 * Rules are tuned for recall: a false positive costs the reviewer one click,
 * a false negative leaks an identifier.
 */
import type { Category } from "../core/types";

export interface Span {
  start: number;
  end: number;
  category: Category;
  /** Optional replacement label, e.g. the birth year for NAISSANCE. */
  label?: string;
}

const UPPER = "A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ";
const LOWER = "a-zàâäçéèêëîïôöùûüÿœæ";

/** Check the 2-digit control key of a French NIR (13 digits + key). */
export function isValidNir(raw: string): boolean {
  const digits = raw.replace(/\s/g, "").toUpperCase();
  if (!/^[12378]\d{2}(0[1-9]|1[0-2]|[2-9]\d)(\d{2}|2A|2B)\d{6}\d{2}$/.test(digits)) return false;
  const body = digits.slice(0, 13).replace("2A", "19").replace("2B", "18");
  const key = Number(digits.slice(13));
  return 97 - Number(BigInt(body) % 97n) === key;
}

/** Luhn check, used by SIRET, SIREN and FINESS numbers. */
export function isLuhnValid(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    sum += d;
  }
  return digits.length > 0 && sum % 10 === 0;
}

interface Rule {
  category: Category;
  re: RegExp;
  /** Capture group holding the identifier itself (0 = whole match). */
  group?: number;
  accept?: (value: string) => boolean;
  label?: (m: RegExpExecArray) => string;
  /** Anchored on a label: also worth running on visual rows (see visualRows). */
  labelled?: boolean;
}

const RULES: Rule[] = [
  {
    category: "NIR",
    re: /\b[12378]\s?\d{2}\s?\d{2}\s?(?:\d{2}|2A|2B)\s?\d{3}\s?\d{3}(?:\s?\d{2})?\b/g,
    // Without a key the shape alone is too weak; with one, the key must check out.
    accept: (v) => v.replace(/\s/g, "").length === 15 && isValidNir(v),
  },
  { category: "IPP", re: /\b(?:IPP|I\.P\.P\.?|N°\s*patient)\s*:?\s*(\d{5,})/gi, group: 1, labelled: true },
  {
    category: "DOSSIER",
    re: /\b(?:Admission|Séjour|S[ée]jour|N°\s*(?:de\s*)?dossier|Dossier|NDA|N°\s*venue)\s*:?\s*([A-Z0-9][A-Z0-9-]{4,})/gi,
    group: 1,
    accept: (v) => /\d{4,}/.test(v),
    labelled: true,
  },
  // Long codes need no label: admission, stay or record numbers, RPPS...
  { category: "DOSSIER", re: /\b[A-Z]{0,3}\d{8,}\b/g },
  {
    category: "ETABLISSEMENT",
    re: /\b(?:FINESS|SIRET|SIREN)\s*:?\s*(\d(?:[ .]?\d){8,13})/gi,
    group: 1,
    labelled: true,
  },
  // A spaced 9- or 14-digit group that passes the Luhn check, label or not.
  {
    category: "ETABLISSEMENT",
    re: /(?<!\d ?)\d{1,5}(?: \d{1,5}){1,4}(?! ?\d)/g,
    accept: (v) => [9, 14].includes(v.replace(/\D/g, "").length) && isLuhnValid(v),
  },
  { category: "TEL", re: /(?:\+33\s?|\b0)[1-9](?:[\s.-]?\d{2}){4}\b/g },
  { category: "EMAIL", re: /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g },
  {
    category: "NAISSANCE",
    re: /\b(?:N[ée]e?\s*\(e\)|N[ée]e?|Date de naissance|DDN)\s*(?:le\s*)?:?\s*(\d{1,2}[/.-]\d{1,2}[/.-](\d{4}|\d{2}))/gi,
    group: 1,
    label: (m) => `[NE(E) EN ${m[2].length === 4 ? m[2] : "19" + m[2]}]`,
    labelled: true,
  },
  {
    category: "ADRESSE",
    re: new RegExp(
      String.raw`\b\d{1,4}\s?(?:bis|ter)?,?\s+(?:rue|avenue|av\.|boulevard|bd|allée|allee|chemin|impasse|place|route|cours|quai|lotissement|résidence|residence|lieu-dit)\b[^\n,;]{2,50}`,
      "gi",
    ),
  },
  // Postal boxes: "BP 123", "CS 81234", "TSA 30001".
  { category: "ADRESSE", re: /\b(?:BP|CS|TSA)[ \t]?\d{2,5}\b/g },
  {
    category: "VILLE",
    re: new RegExp(String.raw`\b\d{5}[ \t]+[${UPPER}][${UPPER}${LOWER}' -]{1,40}?(?:\s+CEDEX(?:\s\d+)?)?(?=$|[\n,.;)])`, "gm"),
  },
  {
    category: "ETABLISSEMENT",
    re: new RegExp(
      String.raw`\b(?:CENTRE HOSPITALIER|Centre [Hh]ospitalier|CHU|CHS|CH|Clinique|CLINIQUE|H[ôo]pital|H[ÔO]PITAL|EHPAD|CMP|CSAPA|CAARUD|SSR)[ \t]+(?:(?:de|du|des|d'|la|le|l'|et|Saint|St|Sainte)[ \t]*|[${UPPER}][${UPPER}${LOWER}'-]+[ \t]*){1,6}`,
      "g",
    ),
    accept: (v) => v.trim().split(/\s+/).length >= 2,
  },
];

export function findRuleSpans(text: string, { labelledOnly = false } = {}): Span[] {
  const spans: Span[] = [];
  for (const rule of RULES) {
    if (labelledOnly && !rule.labelled) continue;
    rule.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.re.exec(text))) {
      const value = m[rule.group ?? 0];
      if (!value) continue;
      const start = m.index + m[0].indexOf(value);
      const trimmed = value.replace(/[\s,.;-]+$/, "");
      if (rule.accept && !rule.accept(trimmed)) continue;
      spans.push({ start, end: start + trimmed.length, category: rule.category, label: rule.label?.(m) });
    }
  }
  return spans;
}
