/**
 * Line-numbered views of pseudonymized pages: what the cloud model reads
 * next to each page image, and what its answers point back to.
 */
import type { PageText, Rect } from "../core/types";

export interface Line {
  page: number;
  /** 1-based line number on its page. */
  line: number;
  text: string;
}

export function pageLines(page: PageText): Line[] {
  return page.text
    .replace(/\n$/, "")
    .split("\n")
    .map((text, i) => ({ page: page.page, line: i + 1, text }));
}

/** Where each line of a page is drawn (null for a line without words), in the order of pageLines. */
export function lineBoxes(page: PageText): (Rect | null)[] {
  const boxes: (Rect | null)[] = [];
  let offset = 0;
  let w = 0;
  for (const { text } of pageLines(page)) {
    const end = offset + text.length;
    let box: Rect | null = null;
    for (; w < page.words.length && page.words[w].start < end; w++) {
      const r = page.words[w].rect;
      box = box ? [Math.min(box[0], r[0]), Math.min(box[1], r[1]), Math.max(box[2], r[2]), Math.max(box[3], r[3])] : [...r];
    }
    boxes.push(box);
    offset = end + 1;
  }
  return boxes;
}

/** "p3 L12 | text" — the anchor format the prompts ask the model to cite. */
export function formatLines(lines: Line[]): string {
  return lines.map((l) => `p${l.page + 1} L${l.line} | ${l.text}`).join("\n");
}

/** A running header or footer sits at the same line of every page, give or take this many lines. */
const PLACE_TOLERANCE = 2;

const median = (values: number[]): number => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

/**
 * Lines repeated on most pages at about the same place, counted from the top
 * or from the bottom of the page: running headers and footers (the
 * "encadré"), whatever the hospital. A phrase that only comes back often in
 * the notes ("Vue ce jour", "Validé par [SOIGNANT_2]") is not one: it moves
 * from page to page. Passed to the model as a hint and left out of the text
 * of an observation, never removed from the document.
 */
export function repeatedLines(pages: PageText[], minShare = 0.6): Set<string> {
  if (pages.length < 3) return new Set();
  /** Per text, per page: where it stands, from the top and from the bottom. */
  const places = new Map<string, { top: number; bottom: number }[][]>();
  for (const page of pages) {
    const lines = pageLines(page);
    const here = new Map<string, { top: number; bottom: number }[]>();
    lines.forEach((l, i) => {
      const t = l.text.trim().replace(/\d+/g, "#");
      if (t.length <= 2) return;
      here.set(t, [...(here.get(t) ?? []), { top: i, bottom: lines.length - 1 - i }]);
    });
    for (const [t, at] of here) places.set(t, [...(places.get(t) ?? []), at]);
  }
  const out = new Set<string>();
  for (const [t, perPage] of places) {
    if (perPage.length / pages.length < minShare) continue;
    for (const side of ["top", "bottom"] as const) {
      const usual = median(perPage.map((at) => Math.min(...at.map((p) => p[side]))));
      const there = perPage.filter((at) => at.some((p) => Math.abs(p[side] - usual) <= PLACE_TOLERANCE)).length;
      if (there / pages.length >= minShare) out.add(t);
    }
  }
  return out;
}

export function isRepeated(text: string, repeated: Set<string>): boolean {
  return repeated.has(text.trim().replace(/\d+/g, "#"));
}

/** Text of a span of lines, inclusive, across pages. */
export function linesBetween(
  pages: PageText[],
  start: { page: number; line: number },
  end: { page: number; line: number },
  skip?: Set<string>,
): Line[] {
  const out: Line[] = [];
  for (const page of pages) {
    if (page.page < start.page || page.page > end.page) continue;
    for (const l of pageLines(page)) {
      if (page.page === start.page && l.line < start.line) continue;
      if (page.page === end.page && l.line > end.line) continue;
      if (skip && isRepeated(l.text, skip)) continue;
      out.push(l);
    }
  }
  return out;
}

/**
 * Where a span of lines is drawn, page by page: an observation that runs
 * over several pages is shown on each of them.
 */
export function spanBoxes(
  pages: PageText[],
  start: { page: number; line: number },
  end: { page: number; line: number },
  skip?: Set<string>,
): Record<number, Rect[]> {
  const out: Record<number, Rect[]> = {};
  for (const page of pages) {
    if (page.page < start.page || page.page > end.page) continue;
    const boxes = lineBoxes(page);
    const rects = pageLines(page).flatMap((l, i) => {
      if (page.page === start.page && l.line < start.line) return [];
      if (page.page === end.page && l.line > end.line) return [];
      if (skip && isRepeated(l.text, skip)) return [];
      return boxes[i] ? [boxes[i]] : [];
    });
    if (rects.length) out[page.page] = rects;
  }
  return out;
}
