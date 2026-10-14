import type { PageText, Rect } from "./types";

export function unionRect(a: Rect, b: Rect): Rect {
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
}

export function padRect(r: Rect, pad: number): Rect {
  return [r[0] - pad, r[1] - pad, r[2] + pad, r[3] + pad];
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
}

/**
 * Boxes covering the characters [start, end) of a page's text: one box per
 * visual line, so a span that wraps produces two boxes instead of one huge
 * one swallowing the text in between.
 */
export function rectsForSpan(page: PageText, start: number, end: number): Rect[] {
  const rects: Rect[] = [];
  let current: Rect | null = null;
  let lastBottom = -Infinity;
  for (const word of page.words) {
    if (word.end <= start || word.start >= end) continue;
    const r = word.rect;
    const sameLine = current && Math.abs(r[3] - lastBottom) < (r[3] - r[1]) * 0.5;
    if (current && sameLine) {
      current = unionRect(current, r);
    } else {
      if (current) rects.push(current);
      current = [...r];
    }
    lastBottom = r[3];
  }
  if (current) rects.push(current);
  return rects;
}

/** Character offsets of the words lying inside a rectangle (manual boxes). */
export function spanForRect(page: PageText, rect: Rect): { start: number; end: number } | null {
  const hits = page.words.filter((w) => rectsOverlap(w.rect, rect));
  if (hits.length === 0) return null;
  return { start: Math.min(...hits.map((w) => w.start)), end: Math.max(...hits.map((w) => w.end)) };
}
