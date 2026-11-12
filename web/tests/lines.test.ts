import { describe, expect, it } from "vitest";

import type { PageText } from "../src/core/types";
import { spanBoxes } from "../src/notebook/lines";

/** A page of one word per line, each line 10 units high. */
function page(n: number, lines: string[]): PageText {
  let offset = 0;
  const words = lines.map((text, i) => {
    const w = { text, rect: [0, i * 10, 50, i * 10 + 8] as [number, number, number, number], start: offset, end: offset + text.length };
    offset += text.length + 1;
    return w;
  });
  return { page: n, width: 100, height: 200, text: lines.join("\n"), words, source: "pdf" };
}

describe("spanBoxes", () => {
  const pages = [page(0, ["bandeau", "titre", "début"]), page(1, ["bandeau", "milieu"]), page(2, ["bandeau", "fin", "autre"])];

  it("covers every page of an observation, not only the first", () => {
    const boxes = spanBoxes(pages, { page: 0, line: 2 }, { page: 2, line: 2 });
    expect(Object.keys(boxes).map(Number)).toEqual([0, 1, 2]);
    expect(boxes[0]).toHaveLength(2);
    expect(boxes[1]).toHaveLength(2);
    expect(boxes[2]).toHaveLength(2);
    expect(boxes[2][1]).toEqual([0, 10, 50, 18]);
  });

  it("leaves the running header out on the pages it crosses", () => {
    const boxes = spanBoxes(pages, { page: 0, line: 2 }, { page: 2, line: 2 }, new Set(["bandeau"]));
    expect(boxes[1]).toEqual([[0, 10, 50, 18]]);
    expect(boxes[2]).toEqual([[0, 10, 50, 18]]);
  });

  it("stays on one page for an observation of one page", () => {
    const boxes = spanBoxes(pages, { page: 1, line: 2 }, { page: 1, line: 2 });
    expect(boxes).toEqual({ 1: [[0, 10, 50, 18]] });
  });
});
