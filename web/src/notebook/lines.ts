/**
 * Line-numbered views of pseudonymized pages: what the cloud model reads
 * next to each page image, and what its answers point back to.
 */
import type { PageText } from "../core/types";

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

/** "p3 L12 | text" — the anchor format the prompts ask the model to cite. */
export function formatLines(lines: Line[]): string {
  return lines.map((l) => `p${l.page + 1} L${l.line} | ${l.text}`).join("\n");
}

/**
 * Lines repeated on most pages at about the same place: running headers and
 * footers (the "encadré"), whatever the hospital. Passed to the model as a
 * hint, never removed from the document.
 */
export function repeatedLines(pages: PageText[], minShare = 0.6): Set<string> {
  if (pages.length < 3) return new Set();
  const counts = new Map<string, number>();
  for (const page of pages) {
    const seen = new Set(
      pageLines(page)
        .map((l) => l.text.trim().replace(/\d+/g, "#"))
        .filter((t) => t.length > 2),
    );
    for (const t of seen) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, n]) => n / pages.length >= minShare).map(([t]) => t));
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
