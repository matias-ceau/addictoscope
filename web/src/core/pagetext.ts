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
