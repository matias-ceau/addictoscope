import type { PageText, Rect, Word } from "./types";

/** Join tokens into one string (space within a line, newline between lines). */
export function buildPageText(
  page: number,
  width: number,
  height: number,
  lines: { text: string; rect: Rect }[][],
  source: PageText["source"],
): PageText {
  let text = "";
  const words: Word[] = [];
  for (const line of lines) {
    line.forEach((w, i) => {
      if (i > 0) text += " ";
      words.push({ text: w.text, rect: w.rect, start: text.length, end: text.length + w.text.length });
      text += w.text;
    });
    text += "\n";
  }
  return { page, width, height, text, words, source };
}

/**
 * The page's words regrouped by visual row: same height, left to right.
 *
 * Form-like headers come out of the text layer column by column, so a label
 * ("Admission", "Finess") can land lines away from its value. Rules that need
 * a label next to its value also run on this view.
 */
export interface RowText {
  text: string;
  /** Each word of `text`, with the index of the same word in the page's words. */
  words: { start: number; end: number; index: number }[];
}

/** A horizontal gap wider than this many word heights separates two columns. */
const COLUMN_GAP = 1.5;

export function visualRows(page: PageText): RowText {
  const order = page.words.map((_, i) => i);
  const midY = (i: number) => (page.words[i].rect[1] + page.words[i].rect[3]) / 2;
  order.sort((a, b) => midY(a) - midY(b));

  const rows: number[][] = [];
  let band: [number, number] | null = null;
  for (const i of order) {
    const [, y0, , y1] = page.words[i].rect;
    // Same row while the word's middle stays inside the row's first word band.
    if (band && midY(i) >= band[0] && midY(i) <= band[1]) rows[rows.length - 1].push(i);
    else {
      rows.push([i]);
      band = [y0, y1];
    }
  }

  let text = "";
  const words: RowText["words"] = [];
  for (const row of rows) {
    row.sort((a, b) => page.words[a].rect[0] - page.words[b].rect[0]);
    row.forEach((i, k) => {
      if (k > 0) {
        // A wide gap between two columns becomes a tab, which a name never spans:
        // "Docteur Martine VERCHAMP" in the letterhead, "Ce patient" in the letter.
        const prev = page.words[row[k - 1]].rect;
        const rect = page.words[i].rect;
        text += rect[0] - prev[2] > COLUMN_GAP * (rect[3] - rect[1]) ? "\t" : " ";
      }
      words.push({ start: text.length, end: text.length + page.words[i].text.length, index: i });
      text += page.words[i].text;
    });
    text += "\n";
  }
  return { text, words };
}

/**
 * Map a span of `rows.text` back to spans of the page text: one per run of
 * words that are also adjacent on one line of the page text.
 */
export function rowSpanToPage(page: PageText, rows: RowText, start: number, end: number): { start: number; end: number }[] {
  const out: { start: number; end: number; last: number }[] = [];
  for (const w of rows.words) {
    if (w.end <= start || w.start >= end) continue;
    const orig = page.words[w.index];
    const s = orig.start + Math.max(0, start - w.start);
    const e = orig.end - Math.max(0, w.end - end);
    const prev = out[out.length - 1];
    if (prev && prev.last === w.index - 1 && !page.text.slice(prev.end, s).includes("\n")) {
      prev.end = e;
      prev.last = w.index;
    } else out.push({ start: s, end: e, last: w.index });
  }
  return out.map(({ start, end }) => ({ start, end }));
}
