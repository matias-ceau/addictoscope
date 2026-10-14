/**
 * OCR for image-only pages, used *only to locate* identifiers on the page.
 * The recognised text is never handed to later steps: the redacted PDF
 * keeps its original pixels, and downstream models read the page image.
 */
import type Tesseract from "tesseract.js";

import { buildPageText } from "./pagetext";
import type { PageText, Rect } from "./types";

/** Render zoom used for OCR (2 = 144 dpi): a balance of accuracy and speed. */
export const OCR_ZOOM = 2;

export async function ocrPage(
  worker: Tesseract.Worker,
  image: Tesseract.ImageLike,
  page: number,
  width: number,
  height: number,
  zoom = OCR_ZOOM,
): Promise<PageText> {
  const { data } = await worker.recognize(image, {}, { blocks: true });
  const lines: { text: string; rect: Rect }[][] = [];
  for (const block of data.blocks ?? []) {
    for (const paragraph of block.paragraphs) {
      for (const line of paragraph.lines) {
        const words = line.words
          .filter((w) => w.text.trim())
          .map((w) => ({
            text: w.text.trim(),
            rect: [w.bbox.x0 / zoom, w.bbox.y0 / zoom, w.bbox.x1 / zoom, w.bbox.y1 / zoom] as Rect,
          }));
        if (words.length) lines.push(words);
      }
    }
  }
  return buildPageText(page, width, height, lines, "ocr");
}
