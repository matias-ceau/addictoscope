/**
 * Turn raw rule and name hits into reviewable detections across a whole set
 * of documents: resolve overlaps, group mentions into entities, propagate
 * every name found once to all its other occurrences, and assign stable
 * pseudonym labels.
 */
import { rectsForSpan } from "../core/geometry";
import { rowSpanToPage, visualRows } from "../core/pagetext";
import type { Category, Detection, DetectionSource, PageText } from "../core/types";
import { PERSON_CATEGORIES } from "../core/types";
import { COMMON_WORDS, findNameSpans, nameTokens, normaliseName, trimModelPerson } from "./names";
import type { NerSpan } from "./ner";
import { findRuleSpans } from "./rules";

export interface SourceDoc {
  id: string;
  pages: PageText[];
  /** Spans proposed by the local NER model, by page index (optional). */
  ner?: Record<number, NerSpan[]>;
}

interface Hit {
  doc: string;
  page: number;
  start: number;
  end: number;
  category: Category;
  source: DetectionSource;
  label?: string;
  /** Shown to the reviewer but not masked unless they accept it. */
  suggested?: boolean;
}

/** Lines that identify the patient (header bandeau, labelled identity fields). */
const PATIENT_MARKER = /\b(IPP|N[ée]e?\s*\(e\)|N[ée]e? le|Date de naissance|Admission|Patiente?\s*:|Patiente?\b)/i;

/** Rank so that, on overlap, the more specific hit survives. */
const SOURCE_RANK: Record<DetectionSource, number> = { manual: 4, rule: 3, name: 2, ner: 2, propagation: 1 };

function resolveOverlaps(hits: Hit[]): Hit[] {
  const sorted = [...hits].sort(
    (a, b) => SOURCE_RANK[b.source] - SOURCE_RANK[a.source] || b.end - b.start - (a.end - a.start),
  );
  const kept: Hit[] = [];
  for (const h of sorted) {
    const clash = kept.find((k) => k.doc === h.doc && k.page === h.page && k.start < h.end && h.start < k.end);
    if (!clash) {
      kept.push(h);
      continue;
    }
    // A longer person span from a weaker source (e.g. "MARCHAND Odette" found by
    // kinship vs "Odette" alone) should absorb the shorter one.
    const bothPeople = PERSON_CATEGORIES.has(h.category) && PERSON_CATEGORIES.has(clash.category);
    if (bothPeople && h.start === clash.start && h.end === clash.end) {
      clash.category = moreSpecific(h.category, clash.category);
      continue;
    }
    if (bothPeople && h.start <= clash.start && h.end >= clash.end && h.end - h.start > clash.end - clash.start) {
      kept[kept.indexOf(clash)] = { ...h, category: moreSpecific(h.category, clash.category) };
    }
  }
  return kept.sort((a, b) => a.doc.localeCompare(b.doc) || a.page - b.page || a.start - b.start);
}

function moreSpecific(a: Category, b: Category): Category {
  const order: Category[] = ["PATIENT", "PROCHE", "SOIGNANT", "PERSONNE"];
  return order.indexOf(a) <= order.indexOf(b) ? a : b;
}

interface Entity {
  key: string;
  category: Category;
  surnames: Set<string>;
  firstNames: Set<string>;
  patientScore: number;
  mentions: number;
}

/**
 * Strip accents one character at a time, so offsets in the folded text are
 * the same as in the original ("Hélène" -> "Helene", same length).
 */
export function foldChars(text: string): string {
  let out = "";
  for (const c of text) out += c.length === 1 ? c.normalize("NFD")[0] : c;
  return out;
}

/** The hit's line plus the lines just above and below it. */
function surroundingLines(text: string, start: number, end: number): string {
  let from = text.lastIndexOf("\n", start - 1);
  from = from <= 0 ? 0 : text.lastIndexOf("\n", from - 1) + 1;
  let to = text.indexOf("\n", end);
  if (to >= 0) to = text.indexOf("\n", to + 1);
  return text.slice(from, to < 0 ? undefined : to);
}

function specificity(p: { sn: string[]; fn: string[] }): number {
  return (p.sn.length > 0 ? 2 : 0) + (p.fn.length > 0 ? 1 : 0);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Find every occurrence of `token` in `text` as a whole word. */
function findWord(text: string, token: string, caseSensitive: boolean): number[] {
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(token)}(?![\\p{L}\\p{N}])`, caseSensitive ? "gu" : "giu");
  const out: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(m.index);
  return out;
}

export function detectCorpus(docs: SourceDoc[]): Detection[] {
  const pageText = new Map<string, PageText>();
  const key = (doc: string, page: number) => `${doc}#${page}`;
  let hits: Hit[] = [];

  for (const doc of docs) {
    for (const page of doc.pages) {
      pageText.set(key(doc.id, page.page), page);
      for (const s of findRuleSpans(page.text)) hits.push({ doc: doc.id, page: page.page, source: "rule", ...s });
      for (const s of findNameSpans(page.text)) hits.push({ doc: doc.id, page: page.page, source: "name", ...s });
      // Again on the visual rows, for labels the text layer put away from their value.
      const rows = visualRows(page);
      const fromRows = [
        ...findRuleSpans(rows.text).map((s) => ({ ...s, source: "rule" as const })),
        ...findNameSpans(rows.text).map((s) => ({ ...s, source: "name" as const })),
      ];
      for (const s of fromRows) {
        for (const span of rowSpanToPage(page, rows, s.start, s.end)) hits.push({ doc: doc.id, page: page.page, ...s, ...span });
      }
      for (const s of doc.ner?.[page.page] ?? []) {
        if (s.label === "PER") {
          const span = trimModelPerson(page.text, s.start, s.end);
          if (span) hits.push({ doc: doc.id, page: page.page, source: "ner", category: "PERSONNE", ...span });
        } else if (s.label === "LOC") {
          // Places are quasi-identifiers: offered for review, not masked by default.
          hits.push({ doc: doc.id, page: page.page, source: "ner", category: "VILLE", start: s.start, end: s.end, suggested: true });
        }
      }
    }
  }
  hits = resolveOverlaps(hits);

  // Group person mentions into entities keyed by surname (+ first name if known).
  const entities: Entity[] = [];
  const entityOf = new Map<Hit, Entity>();
  // Full names first, so "MARCHAND Sylvie" and "MARCHAND Odette" become two
  // entities before any bare "MARCHAND" gets a chance to fuse them.
  const personHits = hits
    .filter((h) => PERSON_CATEGORIES.has(h.category))
    .map((h) => {
      const { surnames, firstNames } = nameTokens(pageText.get(key(h.doc, h.page))!.text.slice(h.start, h.end));
      return { h, sn: surnames.map(normaliseName), fn: firstNames.map(normaliseName) };
    })
    .sort((a, b) => specificity(b) - specificity(a));
  for (const { h, sn, fn } of personHits) {
    const page = pageText.get(key(h.doc, h.page))!;
    let entity = entities.find(
      (e) =>
        (sn.length > 0 && sn.every((s) => e.surnames.has(s)) && (fn.length === 0 || e.firstNames.size === 0 || fn.some((f) => e.firstNames.has(f)))) ||
        (sn.length === 0 && fn.length > 0 && fn.some((f) => e.firstNames.has(f))),
    );
    if (!entity) {
      entity = { key: [...sn, ...fn].join(" "), category: h.category, surnames: new Set(), firstNames: new Set(), patientScore: 0, mentions: 0 };
      entities.push(entity);
    }
    sn.forEach((s) => entity!.surnames.add(s));
    fn.forEach((f) => entity!.firstNames.add(f));
    entity.category = moreSpecific(entity.category, h.category);
    entity.mentions++;
    if (PATIENT_MARKER.test(surroundingLines(page.text, h.start, h.end))) entity.patientScore++;
    if (h.category === "PATIENT") entity.patientScore += 2;
    entityOf.set(h, entity);
  }

  // The patient is the person most often named on identity lines.
  const candidates = entities.filter((e) => e.category !== "SOIGNANT" && e.category !== "PROCHE" && e.patientScore > 0);
  candidates.sort((a, b) => b.patientScore - a.patientScore || b.mentions - a.mentions);
  if (candidates[0]) candidates[0].category = "PATIENT";
  for (const e of entities) if (e.category === "PATIENT" && e !== candidates[0]) e.category = "PERSONNE";

  // Values found once are searched for everywhere, so a birth date or a
  // hospital name caught in a header is also caught in a free-text note.
  const valueHits = new Map<string, Hit>();
  for (const h of hits) {
    if (PERSON_CATEGORIES.has(h.category) || h.suggested) continue;
    const value = foldChars(pageText.get(key(h.doc, h.page))!.text.slice(h.start, h.end)).toUpperCase();
    if (value.replace(/\W/g, "").length >= 4 && !valueHits.has(value)) valueHits.set(value, h);
  }

  // Propagate: surnames anywhere (any case), first names only when capitalised.
  for (const doc of docs) {
    for (const page of doc.pages) {
      const folded = foldChars(page.text);
      for (const e of entities) {
        const tokens = [...e.surnames, ...e.firstNames].filter((t) => t.length >= 3 && !COMMON_WORDS.has(t));
        for (const token of tokens) {
          for (const start of findWord(folded, token, false)) {
            const original = page.text.slice(start, start + token.length);
            if (e.firstNames.has(token) && original[0] !== original[0].toUpperCase()) continue;
            const h: Hit = { doc: doc.id, page: page.page, start, end: start + token.length, category: e.category, source: "propagation" };
            hits.push(h);
            entityOf.set(h, e);
          }
        }
      }
      for (const [value, origin] of valueHits) {
        for (const start of findWord(folded, value, false)) {
          hits.push({ ...origin, doc: doc.id, page: page.page, start, end: start + value.length, source: "propagation" });
        }
      }
    }
  }
  hits = resolveOverlaps(hits);

  // Surname-only mentions shared by several entities ("Mme MARCHAND" with a
  // patient and her mother both named MARCHAND) default to the patient.
  const patient = candidates[0];
  for (const h of hits) {
    if (!PERSON_CATEGORIES.has(h.category)) continue;
    const text = normaliseName(pageText.get(key(h.doc, h.page))!.text.slice(h.start, h.end));
    const owners = entities.filter((e) => text.split(/\s+/).every((t) => e.surnames.has(t) || e.firstNames.has(t)));
    if (owners.length > 1 && patient && owners.includes(patient)) entityOf.set(h, patient);
    else if (owners.length >= 1 && !entityOf.has(h)) entityOf.set(h, owners[0]);
  }

  // Labels: one per entity for people, one per distinct value for places.
  const counters = new Map<string, number>();
  const labelOf = new Map<string, string>();
  const nextLabel = (category: string, entityKey: string) => {
    const k = `${category}|${entityKey}`;
    if (!labelOf.has(k)) {
      const n = (counters.get(category) ?? 0) + 1;
      counters.set(category, n);
      labelOf.set(k, category === "PATIENT" ? "[PATIENT]" : `[${category}_${n}]`);
    }
    return labelOf.get(k)!;
  };
  const FIXED: Partial<Record<Category, string>> = {
    IPP: "[IPP]", NIR: "[NIR]", DOSSIER: "[DOSSIER]", TEL: "[TEL]", EMAIL: "[EMAIL]", ADRESSE: "[ADRESSE]", VILLE: "[VILLE]",
  };

  return hits.map((h, i): Detection => {
    const page = pageText.get(key(h.doc, h.page))!;
    const text = page.text.slice(h.start, h.end);
    const entity = entityOf.get(h);
    const category = entity ? entity.category : h.category;
    const entityKey = entity ? entity.key : normaliseName(text);
    const label = h.label ?? FIXED[category] ?? nextLabel(category, entityKey);
    return {
      id: `d${i}`,
      doc: h.doc,
      page: h.page,
      start: h.start,
      end: h.end,
      text,
      category,
      source: h.source,
      entity: `${category}:${entityKey}`,
      label,
      rects: rectsForSpan(page, h.start, h.end),
      accepted: !h.suggested,
    };
  });
}
