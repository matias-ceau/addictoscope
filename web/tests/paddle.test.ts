import { beforeAll, describe, expect, it } from "vitest";

import { OCR_ZOOM } from "../src/core/ocr";
import { paddleLines, type PaddleModels } from "../src/core/paddle";
import { openPdf, renderPageRgb } from "../src/core/pdf";
import { loadPaddle, PADDLE_INSTALLED, readSample } from "./helpers";

describe.skipIf(!PADDLE_INSTALLED)("PaddleOCR", () => {
  let m: PaddleModels;
  beforeAll(async () => {
    m = await loadPaddle();
  });

  it("reads the alphabet from the recogniser metadata", () => {
    expect(m.chars.length).toBeGreaterThan(100);
    for (const c of "éèàçÉÀ0123456789") expect(m.chars).toContain(c);
  });

  it("tiles each line with its word rects, so masking a word leaves no sliver", async () => {
    const doc = openPdf(readSample("synthetique-courrier-scanne.pdf"));
    const lines = await paddleLines(m, renderPageRgb(doc, 0, OCR_ZOOM));
    expect(lines.map((l) => l.text).join("\n")).toContain("Sylvie MARCHAND");
    for (const l of lines) {
      expect(l.words.map((w) => w.text).join(" ")).toBe(l.text.trim().replace(/\s+/g, " "));
      expect(l.words[0].box.x0).toBeCloseTo(l.box.x0, 6);
      expect(l.words.at(-1)!.box.x1).toBeCloseTo(l.box.x1, 6);
      // Neighbours touch, or overlap on a tilted line: never a gap.
      for (let i = 1; i < l.words.length; i++) expect(l.words[i].box.x0).toBeLessThanOrEqual(l.words[i - 1].box.x1 + 1e-6);
    }
  });
});
