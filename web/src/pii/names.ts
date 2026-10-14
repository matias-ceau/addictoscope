/**
 * Person-name spotting without a model: titles, signature lines, labelled
 * header fields, kinship words and a first-name gazetteer. Each hit also
 * carries a role guess (soignant, proche, ...) from the context it was
 * found in.
 */
import type { Category } from "../core/types";
import { FIRST_NAMES } from "./firstnames";

export interface NameSpan {
  start: number;
  end: number;
  category: Extract<Category, "PATIENT" | "PROCHE" | "SOIGNANT" | "PERSONNE">;
}

const U = "A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ";
const L = "a-zàâäçéèêëîïôöùûüÿœæ";
/** A capitalised or all-caps word that could be part of a name. */
const NAME_TOKEN = `[${U}][${U}${L}'’-]+`;
const NAME_SEQ = `${NAME_TOKEN}(?:[ \\t]+${NAME_TOKEN}){0,3}`;

/** All-caps words that are routine in clinical exports and never names. */
const CAPS_STOPWORDS = new Set(
  `FICHE OBSERVATION OBSERVATIONS CENTRE HOSPITALIER CSAPA CAARUD ELSA IDE UID CDT IPP UFH UFM CH CHU CHS CEDEX
   NFS TSH ECG EEG IRM TDM HDT SDRE SDT SPDT SPI ASI TCC AS ASS ALD CMU CSS RSA AAH MDPH CAF CPAM PMSI SAMU SAU UHCD
   ATCD TTT RAS DSM CIM TAG TOC TDAH TSPT PTSD EDM SEP VIH VHC VHB HTA AVC IDM BPCO SAS IMC SC TA FC SAT GGT ASAT ALAT
   VGM MCV TP INR CRP DFG MME MR DR PR LE LA LES DE DU DES ET OU EN AU AUX PAR POUR SUR SANS AVEC NON OUI NB PS
   URGENCE ADMISSION MED MÉD PAGE PATIENT PATIENTE COMPTE RENDU HOSPITALISATION SORTIE ENTREE ENTRÉE MOTIF
   CONCLUSION CONCLUSIONS TRAITEMENT TRAITEMENTS ANTECEDENTS ANTÉCÉDENTS HISTOIRE MALADIE EXAMEN CLINIQUE
   SERVICE UNITE UNITÉ POLE PÔLE ADDICTOLOGIE PSYCHIATRIE MEDECINE MÉDECINE CONSULTATION CONSULTATIONS
   FINESS SIRET TEL TÉL FAX MAIL EMAIL GHB GHT LSD MDMA THC CBD OH BZD TSO MSO BHD
   SECOP SMPR CMP CATTP CMPP SPIP JLD JAP UHSA UMD UMP UCSA SAMSAH SAVS ESAT IME ITEP CHRS CADA SIAO PASS EMPP
   MONSIEUR MADAME MADEMOISELLE DOCTEUR PROFESSEUR RPPS ADELI NUM STANDARD COURRIER GROUPE VALIDÉ VALIDE IMPRIMÉ
   CPR GEL INJ SOL AMP MG ML KG UI LP AP ASP NB TTT`
    .split(/\s+/)
    .filter(Boolean),
);

/** Capitalised words that a gazetteer hit should not count when found alone. */
const LONE_NAME_STOPWORDS = new Set(["Rose", "Claire", "France", "Pierre", "Marine", "Ange", "Line", "Lou", "Jade", "Constance", "Martin"]);

function isCapsWord(t: string): boolean {
  return t.length >= 2 && t === t.toUpperCase() && /[A-Z]/.test(t.normalize("NFD"));
}

/** Never propagate a "name" that is also an everyday French word. */
export const COMMON_WORDS = new Set(
  "EST QUI QUE VIT DIT FAIT PAS SON SES LES DES UNE MAIS PUIS AVEC POUR DANS SUR PAR BIEN TRES MOINS PLUS ELLE LUI LEUR SANS SOUS VERS CHEZ ENTRE APRES AVANT ALORS DONC CAR CELA CECI TOUT TOUS RIEN BON BONNE MAL".split(" "),
);

const FOLDED_STOPWORDS = new Set([...CAPS_STOPWORDS].map((w) => normaliseName(w)));

function isNameToken(t: string): boolean {
  const folded = normaliseName(t);
  return !FOLDED_STOPWORDS.has(folded) && !COMMON_WORDS.has(folded);
}

/**
 * Trim a token sequence to its name-like prefix: stop at the first stopword
 * so "DURAND Pierre Psychiatre" or "MARCHAND SYLVIE Admission" lose their tails.
 */
function trimToName(text: string, start: number, end: number): { start: number; end: number } | null {
  const re = new RegExp(NAME_TOKEN, "g");
  const segment = text.slice(start, end);
  let kept = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(segment))) {
    if (!isNameToken(m[0])) break;
    if (kept > 0 && !/^[ \t]+$/.test(segment.slice(kept, m.index))) break;
    kept = m.index + m[0].length;
  }
  return kept ? { start, end: start + kept } : null;
}

interface ContextRule {
  re: RegExp;
  category: NameSpan["category"];
  /** Keep the captured group as is instead of trimming it to capitalised tokens. */
  raw?: boolean;
}

const LOWERCASE_STOPWORDS = new Set("les des une est qui que pour avec dans sur par pas son ses aux car mais elle lui leur".split(" "));

const TITLES_SOIGNANT = String.raw`(?:Dr\.?|Docteur|Pr\.?|Professeur|Interne|IDE|Infirmi[eè]re?|Psychologue|Assistante? sociale?|Éducat(?:eur|rice)|Educat(?:eur|rice)|Di[ée]t[ée]ticienne?)`;
const TITLES_CIVIL = String.raw`(?:Mme|Madame|Mlle|Mademoiselle|M\.|Mr\.?|Monsieur)`;
/** Let a keyword start with either case without making the whole regex case-insensitive. */
function anyCase(alternation: string): string {
  return alternation.replace(/(^|\|)([a-zà-ÿ])/g, (_m, sep: string, c: string) => `${sep}[${c}${c.toUpperCase()}]`);
}

const KIN = "(?:" + anyCase(String.raw`m[èe]re|p[èe]re|fr[èe]re|s(?:œ|oe)ur|demi-fr[èe]re|demi-s(?:œ|oe)ur|fils|fille|compagnon|compagne|conjoint|conjointe|mari|[ée]poux|[ée]pouse|ami|amie|copain|copine|oncle|tante|cousin|cousine|neveu|ni[èe]ce|grand-m[èe]re|grand-p[èe]re|beau-p[èe]re|belle-m[èe]re|beau-fr[èe]re|belle-s(?:œ|oe)ur|ex-compagnon|ex-compagne|ex-mari|ex-[ée]pouse|petit ami|petite amie|enfant|tuteur|tutrice|curat(?:eur|rice)`) + ")";

const CONTEXT_RULES: ContextRule[] = [
  // "Dr DURAND", "Docteur Anne LEROY"
  { re: new RegExp(String.raw`\b${TITLES_SOIGNANT}[ \t]+(${NAME_SEQ})`, "g"), category: "SOIGNANT" },
  // Signature lines: "Validé par DURAND Pierre - Psychiatre", "Edité le ... par LEROY Anne"
  { re: new RegExp(String.raw`\bpar[ \t]+(${NAME_SEQ})(?=[ \t]*(?:-|le\b|Page\b|$))`, "gm"), category: "SOIGNANT" },
  // "sa mère Mme MARCHAND Odette", "son frère Thomas"
  { re: new RegExp(String.raw`\b${KIN}[ \t]+(?:${TITLES_CIVIL}[ \t]+)?(${NAME_SEQ})`, "g"), category: "PROCHE" },
  // Labelled header fields: "Médecin référent   Dr GARNIER Paul"
  {
    re: new RegExp(
      String.raw`^[ \t]*(?:M[ée]decin(?:[ \t]+(?:r[ée]f[ée]rent|traitant|prescripteur))?|R[ée]f[ée]rent|Interne|Psychologue|M[ÉE]DECIN(?:[ \t]+(?:R[ÉE]F[ÉE]RENT|TRAITANT))?)[ \t]*:?(?:[ \t]+|[ \t]*\n[ \t]*)(?:${TITLES_SOIGNANT}[ \t]+)?(${NAME_SEQ})`,
      "gm",
    ),
    category: "SOIGNANT",
  },
  {
    re: new RegExp(String.raw`^[ \t]*(?:Patient(?:e)?|PATIENT(?:E)?|Nom(?:[ \t]+(?:de naissance|d'usage|marital))?|NOM|Pr[ée]nom|PR[ÉE]NOM|Identit[ée])[ \t]*:?(?:[ \t]+|[ \t]*\n[ \t]*)(?:${TITLES_CIVIL}[ \t]+)?(${NAME_SEQ})`, "gm"),
    category: "PATIENT",
  },
  // Header identity block: a line holding only a name, right above or below
  // "Né(e) le ..." (or followed on the same line by a date), is the patient.
  {
    re: new RegExp(String.raw`^[ \t]*(${NAME_SEQ})[ \t]*(?=\n[^\n]*\b(?:N[ée]e?[ \t]*\(e\)|N[ée]e?[ \t]+le|Date de naissance)|[ \t]+\d{2}/\d{2}/\d{4}[ \t]*$)`, "gm"),
    category: "PATIENT",
  },
  {
    re: new RegExp(String.raw`(?:N[ée]e?[ \t]*\(e\)|N[ée]e?[ \t]+le|Date de naissance)[^\n]*\n[ \t]*(${NAME_SEQ})[ \t]*$`, "gm"),
    category: "PATIENT",
  },
  // Lowercase notes: "dr lemercier", "Dr. vasseur"
  { re: /\b[Dd](?:r\.?|octeur)[ \t]+([a-zà-ÿ][a-zà-ÿ'’-]{2,})/g, category: "SOIGNANT", raw: true },
  // "Mme MARCHAND", "Monsieur Paul Dupont"
  { re: new RegExp(String.raw`\b${TITLES_CIVIL}[ \t]+(${NAME_SEQ})`, "g"), category: "PERSONNE" },
];

export function findNameSpans(text: string): NameSpan[] {
  const spans: NameSpan[] = [];

  for (const rule of CONTEXT_RULES) {
    rule.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.re.exec(text))) {
      const start = m.index + m[0].lastIndexOf(m[1]);
      if (rule.raw && LOWERCASE_STOPWORDS.has(m[1].toLowerCase())) continue;
      const span = rule.raw ? { start, end: start + m[1].length } : trimToName(text, start, start + m[1].length);
      if (span) spans.push({ ...span, category: rule.category });
    }
  }

  // "DURAND Pierre" / "Pierre DURAND": an all-caps surname next to a known first name.
  const pair = new RegExp(String.raw`\b(${NAME_TOKEN})[ \t]+(${NAME_TOKEN})\b`, "g");
  let m: RegExpExecArray | null;
  while ((m = pair.exec(text))) {
    const [a, b] = [m[1], m[2]];
    const capsThenFirst = isCapsWord(a) && isNameToken(a) && isFirstName(b);
    const firstThenCaps = isFirstName(a) && isCapsWord(b) && isNameToken(b) && !isFirstName(b);
    if (capsThenFirst || firstThenCaps) {
      spans.push({ start: m.index, end: m.index + m[0].length, category: "PERSONNE" });
    }
    pair.lastIndex = m.index + a.length; // allow overlapping pairs
  }

  // Lone first names ("son frère Thomas" is already caught; this catches the rest).
  const word = new RegExp(String.raw`(?<![${U}${L}])(${NAME_TOKEN})(?![${U}${L}])`, "g");
  while ((m = word.exec(text))) {
    const t = m[1];
    if (FIRST_NAMES.has(t) && !LONE_NAME_STOPWORDS.has(t)) {
      spans.push({ start: m.index, end: m.index + t.length, category: "PERSONNE" });
    }
  }

  return spans;
}

/** Split a name span into tokens, telling surnames (caps) from first names. */
export function nameTokens(name: string): { surnames: string[]; firstNames: string[] } {
  const tokens = name.split(/[ \t]+/).filter(Boolean);
  const surnames: string[] = [];
  const firstNames: string[] = [];
  for (const t of tokens) {
    if (isFirstName(t)) firstNames.push(t);
    else {
      surnames.push(t);
      // "PRADIER-VALLON" is also written "Pradier Vallon" or "vallon" alone.
      if (t.includes("-")) surnames.push(...t.split("-").filter((p) => p.length >= 3));
    }
  }
  // "Mme Lemoine": a single capitalised token that is not a known first name is a surname.
  return { surnames, firstNames };
}

/** "SYLVIE", "Sylvie" and "Jean-Pierre" all count as first names. */
const FOLDED_FIRST_NAMES = new Set([...FIRST_NAMES].map((n) => normaliseName(n)));

export function isFirstName(t: string): boolean {
  return t.split("-").every((part) => part.length > 1 && FOLDED_FIRST_NAMES.has(normaliseName(part)));
}

export function capitalise(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

export function normaliseName(t: string): string {
  return t.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase();
}
