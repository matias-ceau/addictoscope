/**
 * Split a pseudonymized document into its observations without a model, when
 * its layout is a known export: every observation then starts with a title
 * line that rules can find. Nothing is sent, nothing is paid, and the result
 * does not depend on a chain of model calls. A document whose layout is not
 * recognised returns null, and segmentRulesFirst falls back to the model
 * (segment.ts).
 *
 * Two layouts are recognised (SPEC.md, « Découpage par règles ») :
 *  - hospital export: "Observation médicale de suivi du 14/03/2022 (Urgence : Bas)"
 *    followed by "Validé par … - Médecin le …", "Validé automatiquement le … par …"
 *    or "Dernière modification le … par … - Interne";
 *  - Word history: "14/03/2022 10:30 : Observation de suivi ( NOM Prénom - Psychiatre )",
 *    on one line or wrapped before or inside its parenthesis.
 *
 * Titles are looked for in reading order (title, author, text, as the page
 * shows them), which is not always the order of the text layer: some exports
 * draw the text of a note before its title. Observations are still anchored
 * in the text layer's lines, like everything else: from the first to the
 * last line of the note there.
 */
import { readingOrderIndex } from "../core/pagetext";
import type { PageText, Rect } from "../core/types";
import { isRepeated, lineBoxes, pageLines, repeatedLines, type Line } from "./lines";
import type { Observation } from "./model";
import { repairObservations, segmentDocument, type SegmentInput } from "./segment";

const DAY = String.raw`(\d{2})\/(\d{2})\/(\d{4})`;
const EXPORT_HEADER = new RegExp(String.raw`^\s*(\S.{1,118}?)\s+du\s+${DAY}\s*(\(\s*Urgence\s*:[^)]*\))?\s*$`);
const WORD_HEADER = new RegExp(String.raw`^\s*${DAY}\S*\s+\d{2}:\d{2}\s*:\s*(\S.*?)\s*\(\s*([^()]*?)\s*(\))?\s*$`);
const VALIDATION = /^\s*(?:Validé\s+(?:par|automatiquement)|Dernière\s+modification\s+le)\b/;
/** "Validé par [SOIGNANT_2] - Médecin urgentiste le 15/11/2022 à 03:05" → "Médecin urgentiste". */
const VALIDATION_ROLE = /\s-\s+(\S.*?)(?:\s+le\s+\d{2}\/\d{2}\/\d{4}.*)?$/;
const AUTHOR_LABEL = /\[(?:SOIGNANT|PERSONNE)_?\d*\]/;
/** "- Interne le 02/05/2022 à 10:15": the end of a validation line whose name was cut out. */
const ROLE_TAIL = /^\s*-\s.{0,60}\ble\s+\d{2}\/\d{2}\/\d{4}/;
const LABELS_ONLY = /^(?:\[[^[\]]{1,40}\]\s*)+$/;
/** More lines than this before the first title: not the banner of an export, the layout is something else. */
const MAX_PREAMBLE = 60;
/** "- Médecin urgentiste le 15/11/2022 à 03:05": longer than this, a line starting with a dash is a note. */
const MAX_ROLE_TAIL = 70;
/** How many lines the end of a validation line may be read after its beginning, when short lines under it come first. */
const ROW_REACH = 4;
/** How far a title at the bottom of a page may be from its validation line, banner in between. */
const VALIDATION_REACH = 60;
/** The summary of a note found by rules is the beginning of its text, up to this many characters. */
const SUMMARY_LENGTH = 140;

/** Functions a title names by itself ("Observation IDE", "Entretien social"). */
const TITLE_ROLES: [RegExp, string][] = [
  [/\b(?:IDE|infirmi[eè]re?s?)\b/i, "Infirmier(ère)"],
  [/\bpsycholog/i, "Psychologue"],
  [/\b(?:AS|ASS|social|sociale)\b/, "Assistant(e) social(e)"],
  [/éducat/i, "Éducateur(trice) spécialisé(e)"],
  [/diét/i, "Diététicien(ne)"],
  [/\bcadre de santé\b/i, "Cadre de santé"],
];

interface Header {
  /** Index in the document's lines. */
  at: number;
  /** Index of the first line after the title. */
  body: number;
  date: string;
  kind: string;
  role: string | null;
  author: string | null;
  /** The role came from the validation line or the title line, not from a guess. */
  stated: boolean;
}

const normalise = (text: string) => text.trim().replace(/\d+/g, "#");

/** A line and where it is drawn (null when it has no words). */
type DrawnLine = Line & { box: Rect | null };

/** The lines of the document as they are read: page after page, top to bottom, column by column. */
export function readingLines(pages: PageText[]): DrawnLine[] {
  return pages.flatMap((page) => {
    const lines = pageLines(page);
    const boxes = lineBoxes(page);
    return readingOrderIndex(boxes).map((i) => ({ ...lines[i], box: boxes[i] }));
  });
}

/** Drawn on the same page and at the same height: two pieces of one row. */
function sameRow(a: DrawnLine, b: DrawnLine): boolean {
  if (!a.box || !b.box || a.page !== b.page) return false;
  const shared = Math.min(a.box[3], b.box[3]) - Math.max(a.box[1], b.box[1]);
  return shared > 0.5 * Math.min(a.box[3] - a.box[1], b.box[3] - b.box[1]);
}

/**
 * Observations of a document whose layout is recognised, null otherwise.
 * An observation holds its title and what is read until the next title,
 * running headers and footers left out at both ends.
 */
export function segmentByRules(doc: string, pages: PageText[]): Observation[] | null {
  const lines = readingLines(pages);
  const repeated = repeatedLines(pages);
  const blank = (text: string) => !text.trim() || LABELS_ONLY.test(text.trim());

  // Titles sure by themselves: a Word title, an export title with its
  // "(Urgence : …)" suffix or with its validation line right under it.
  const candidates = lines.map((l, i) => parseTitle(l.text, lines[i + 1]?.text));
  const sure = candidates.map((c, i) => {
    if (!c || c.sure) return !!c;
    const next = lines.slice(i + 1, i + 4).find((l) => !blank(l.text));
    return !!next && VALIDATION.test(next.text);
  });
  const first = sure.indexOf(true);
  if (first < 0) return null;

  // The banner of the first page is what precedes its first title: it comes
  // back on every page, also in a document too short for repeatedLines.
  const banner = new Set(repeated);
  const preamble = lines.slice(0, first).filter((l) => l.page === lines[first].page && l.text.trim());
  if (lines.slice(0, first).filter((l) => !blank(l.text)).length > MAX_PREAMBLE) return null;
  for (const l of preamble) if (normalise(l.text).length > 2 && !VALIDATION.test(l.text) && !parseTitle(l.text)) banner.add(normalise(l.text));
  // A title or a validation line is never page furniture, even when the text layer
  // happens to put one at the same place of every page.
  const isFurniture = (text: string) => blank(text) || (isRepeated(text, banner) && !VALIDATION.test(text) && !parseTitle(text));

  /** Next line that is not page furniture, within reach. */
  const nextContent = (from: number): number => {
    for (let i = from; i < Math.min(lines.length, from + VALIDATION_REACH); i++) if (!isFurniture(lines[i].text)) return i;
    return -1;
  };

  const headers: Header[] = [];
  candidates.forEach((c, at) => {
    if (!c) return;
    const next = nextContent(at + 1);
    const validated = next >= 0 && VALIDATION.test(lines[next].text);
    if (!sure[at] && !validated) return;
    let role = c.role;
    let author = c.author;
    if (validated) {
      // The name may have been cut out of the line: what followed it ("- Interne le …") is then a
      // line of its own, right after or, when drawn on the same row, a few lines further.
      const line = lines[next].text.trim();
      const isTail = (l: DrawnLine | undefined) => !!l && /^-\s/.test(l.text.trim()) && l.text.trim().length <= MAX_ROLE_TAIL;
      const tail =
        [lines[next + 1]].find(isTail) ?? lines.slice(next + 2, next + 1 + ROW_REACH).find((l) => isTail(l) && sameRow(lines[next], l));
      const status = !/\s-\s/.test(line) && tail ? `${line} ${tail.text.trim()}` : line;
      role = /automatiquement/.test(status) ? null : (status.match(VALIDATION_ROLE)?.[1].trim() ?? null);
      author = status.match(AUTHOR_LABEL)?.[0] ?? null;
    } else if (c.role === null && c.open) {
      const tail = lines[at + c.lines]?.text.trim().match(/^-\s+(\S.*?)\s*\)$/);
      if (tail) role = tail[1];
    }
    headers.push({ at, body: at + c.lines, date: c.date, kind: c.kind, role: role || null, author, stated: !!role });
  });
  if (!headers.length) return null;

  // A title that names a function gives it; then an author keeps the one
  // function stated for them elsewhere in the dossier.
  for (const h of headers) {
    if (h.role) continue;
    h.role = TITLE_ROLES.find(([re]) => re.test(h.kind))?.[1] ?? null;
    h.stated = !!h.role;
  }
  const byAuthor = new Map<string, Set<string>>();
  for (const h of headers) {
    if (!h.author || !h.role || !h.stated) continue;
    byAuthor.set(h.author, (byAuthor.get(h.author) ?? new Set()).add(h.role.toLowerCase()));
  }
  for (const h of headers) {
    if (h.role || !h.author || byAuthor.get(h.author)?.size !== 1) continue;
    h.role = headers.find((o) => o.author === h.author && o.stated)!.role;
  }

  // Back to the text layer, where observations are anchored. Each note is the
  // lines read from its title to the next one; there, they are usually one
  // block, title included. When the export draws the titles apart from the
  // texts, the note is its largest block (its text), joined to any piece of
  // it that no other note's block separates from it.
  const stream = pages.flatMap(pageLines);
  const place = new Map(stream.map((l, i) => [`${l.page}:${l.line}`, i]));
  const owner = new Array<number>(stream.length).fill(-1);
  headers.forEach((h, k) => {
    for (const l of lines.slice(h.at, headers[k + 1]?.at ?? lines.length))
      if (!isFurniture(l.text)) owner[place.get(`${l.page}:${l.line}`)!] = k;
  });
  const main = new Map<number, { lo: number; hi: number; size: number }>();
  let run: { of: number; lo: number; hi: number; size: number } | null = null;
  owner.forEach((k, i) => {
    if (k < 0) return;
    if (run?.of === k) {
      run.hi = i;
      run.size += stream[i].text.length;
    } else {
      run = { of: k, lo: i, hi: i, size: stream[i].text.length };
    }
    if (run.size > (main.get(k)?.size ?? -1)) main.set(k, run);
  });
  const inBlock = owner.map((k, i) => k >= 0 && main.get(k)!.lo <= i && i <= main.get(k)!.hi);
  const raw = headers.flatMap((h, k) => {
    const block = main.get(k);
    if (!block) return [];
    let { lo, hi } = block;
    for (let i = lo - 1; i >= 0 && !(inBlock[i] && owner[i] !== k); i--) if (owner[i] === k) lo = i;
    for (let i = hi + 1; i < stream.length && !(inBlock[i] && owner[i] !== k); i++) if (owner[i] === k) hi = i;
    // No model to sum the note up: the beginning of its text stands for it.
    const text = lines
      .slice(h.body, headers[k + 1]?.at ?? lines.length)
      .find((l) => !isFurniture(l.text) && !VALIDATION.test(l.text) && !ROLE_TAIL.test(l.text))
      ?.text.trim();
    return {
      start: { page: stream[lo].page, line: stream[lo].line },
      end: { page: stream[hi].page, line: stream[hi].line },
      date: h.date,
      kind: h.kind,
      author_role: h.role,
      summary: !text || text.length <= SUMMARY_LENGTH ? (text ?? "") : `${text.slice(0, SUMMARY_LENGTH).replace(/\s+\S*$/, "")}…`,
    };
  });
  const observations = repairObservations(doc, pages, raw, repeated);
  return observations.length ? observations : null;
}

interface Title {
  date: string;
  kind: string;
  role: string | null;
  author: string | null;
  /** Recognised without looking for a validation line. */
  sure: boolean;
  /** Word title whose closing parenthesis is on the next line. */
  open: boolean;
  /** Lines the title takes: 2 when a long Word title wraps before its parenthesis. */
  lines: number;
}

const WORD_START = new RegExp(String.raw`^\s*${DAY}\S*\s+\d{2}:\d{2}\s*:\s*\S`);

function parseTitle(text: string, next?: string): Title | null {
  const wrapped = !WORD_HEADER.test(text) && WORD_START.test(text) && next !== undefined && !WORD_START.test(next);
  const word = (wrapped ? `${text.trim()} ${next!.trim()}` : text).match(WORD_HEADER);
  if (word) {
    const [, d, m, y, kind, who, closed] = word;
    const role = who.match(/\s-\s+(\S.*)$/)?.[1].trim() ?? null;
    return { date: `${y}-${m}-${d}`, kind, role, author: who.match(AUTHOR_LABEL)?.[0] ?? null, sure: true, open: !closed, lines: wrapped ? 2 : 1 };
  }
  const exported = text.match(EXPORT_HEADER);
  if (exported && !VALIDATION.test(text)) {
    const [, kind, d, m, y, urgency] = exported;
    return { date: `${y}-${m}-${d}`, kind, role: null, author: null, sure: !!urgency, open: false, lines: 1 };
  }
  return null;
}

/** How the observations of a document were found: on this machine by rules, or by the model. */
export type SegmentedBy = "rules" | "model";

/**
 * Observations of one document: by rules when its layout is recognised
 * (nothing is sent, the page images are not even made), by the model
 * otherwise. `rules: false` goes straight to the model, e.g. to replay
 * answers recorded before the rules existed.
 */
export async function segmentRulesFirst(
  input: Omit<SegmentInput, "images"> & { images: () => Promise<Record<number, string>> | Record<number, string>; rules?: boolean },
): Promise<{ observations: Observation[]; by: SegmentedBy }> {
  const found = input.rules === false ? null : segmentByRules(input.doc, input.pages);
  if (found) {
    input.onProgress?.(1, 1);
    return { observations: found, by: "rules" };
  }
  return { observations: await segmentDocument({ ...input, images: await input.images() }), by: "model" };
}
