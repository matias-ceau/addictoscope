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

/** A line made only of bracketed labels: "[PATIENT]", "[SOIGNANT_2] [NE(E) EN 1972]". */
const LABELS_ONLY = /^(?:\[[^[\]]{1,40}\]\s*)+$/;
/** A label joins words at most this many label heights away, on its line. */
const LABEL_REACH = 8;

/**
 * Put the labels drawn over redacted spans back where they are read.
 *
 * Labels are drawn after the page's own content, so the text layer returns
 * them as lines of their own at the end of the page, far from their
 * sentence ("Rencontre de Mme" … sixty lines … "[PATIENT]"). Each label
 * joins the line it sits on (same height, nearest words). Content lines are
 * never merged, split or renumbered, so page/line anchors of analyses saved
 * before stay valid; a label with no text at its height keeps its own line.
 */
export function inlineLabels<T extends { text: string; rect: Rect }>(lines: T[][]): T[][] {
  const isLabels = lines.map((l) => l.length > 0 && LABELS_ONLY.test(l.map((w) => w.text).join(" ")));
  if (!isLabels.includes(true)) return lines;
  const bounds = (ws: T[]): Rect => [
    Math.min(...ws.map((w) => w.rect[0])),
    Math.min(...ws.map((w) => w.rect[1])),
    Math.max(...ws.map((w) => w.rect[2])),
    Math.max(...ws.map((w) => w.rect[3])),
  ];
  const content = lines.map((l, i) => (isLabels[i] || !l.length ? null : bounds(l)));
  const out = lines.map((l) => [...l]);
  const touched = new Set<number>();

  lines.forEach((line, i) => {
    if (!isLabels[i]) return;
    // One line can hold several labels drawn side by side.
    const labels: T[][] = [];
    for (const w of line) {
      if (w.text.startsWith("[") || !labels.length) labels.push([w]);
      else labels.at(-1)!.push(w);
    }
    const kept: T[] = [];
    for (const label of labels) {
      const [x0, y0, x1, y1] = bounds(label);
      const midY = (y0 + y1) / 2;
      const height = y1 - y0;
      // Nearest words at this height, on each side. The label is centred in
      // the box of what it replaces, so it can sit some way from both.
      let left = -1;
      let right = -1;
      let leftGap = Infinity;
      let rightGap = Infinity;
      content.forEach((r, j) => {
        if (!r || midY < r[1] || midY > r[3]) return;
        const gap = Math.max(0, x0 - r[2], r[0] - x1);
        if (r[0] + r[2] < x0 + x1) {
          if (gap < leftGap) [left, leftGap] = [j, gap];
        } else if (gap < rightGap) [right, rightGap] = [j, gap];
      });
      // A label follows the words before it; it opens the next ones only
      // when nothing precedes it. Further than LABEL_REACH it is in another column.
      const reach = LABEL_REACH * height;
      const target = leftGap <= reach && leftGap <= rightGap + height ? left : rightGap <= reach ? right : -1;
      if (target < 0) kept.push(...label);
      else {
        out[target].push(...label);
        touched.add(target);
      }
    }
    out[i] = kept;
  });
  for (const j of touched) out[j].sort((a, b) => a.rect[0] - b.rect[0]);

  // An emptied label line goes when only label lines follow it; elsewhere it
  // stays, empty, so the lines after it keep their numbers.
  const lastContent = content.reduce((last, r, i) => (r ? i : last), -1);
  return out.filter((l, i) => l.length > 0 || i < lastContent);
}

/** Two lines whose boxes overlap in height by more than this share of the smaller one are side by side, not one above the other. */
const SAME_ROW = 0.4;

/**
 * Reading order of the lines of a page, from their boxes: `order[k]` is the
 * index of the line read in k-th position.
 *
 * A PDF is free to draw a page in any order, and the text layer follows the
 * drawing. Some hospital exports draw the text of each note before its
 * title: the text layer says "body, title, author" where the page shows
 * "title, author, body". Here a line is read after every line drawn above it
 * in the same column (their widths overlap); lines side by side keep the
 * order of the text layer, which knows the columns better than a sort by
 * height would. A page already in reading order comes out unchanged. A line
 * without a box (null) keeps its place.
 */
export function readingOrderIndex(boxes: (Rect | null)[]): number[] {
  const movable = boxes.flatMap((b, i) => (b ? [i] : []));
  const above = (a: Rect, b: Rect): boolean => {
    if (a[1] + a[3] >= b[1] + b[3]) return false;
    const shared = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
    if (shared > SAME_ROW * Math.min(a[3] - a[1], b[3] - b[1])) return false;
    return Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > 1;
  };
  const waiting = new Map<number, number>(movable.map((i) => [i, 0]));
  const below = new Map<number, number[]>(movable.map((i) => [i, []]));
  for (const i of movable)
    for (const j of movable)
      if (i !== j && above(boxes[i]!, boxes[j]!)) {
        below.get(i)!.push(j);
        waiting.set(j, waiting.get(j)! + 1);
      }
  // Among the lines with nothing left above them, the text layer's first.
  const read: number[] = [];
  const ready = movable.filter((i) => waiting.get(i) === 0);
  while (ready.length) {
    const i = ready.shift()!;
    read.push(i);
    for (const j of below.get(i)!) {
      waiting.set(j, waiting.get(j)! - 1);
      if (waiting.get(j) !== 0) continue;
      const at = ready.findIndex((k) => k > j);
      ready.splice(at < 0 ? ready.length : at, 0, j);
    }
  }
  let next = 0;
  return boxes.map((b, i) => (b ? read[next++] : i));
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
