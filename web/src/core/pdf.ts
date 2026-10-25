/**
 * Everything that touches the PDF bytes, via MuPDF compiled to WebAssembly.
 * Runs unchanged in a browser Web Worker and in Node (tests).
 */
import * as mupdf from "mupdf";

import { padRect, textBand } from "./geometry";
import { buildPageText } from "./pagetext";
import type { PageText, Rect } from "./types";

/** Below this many characters a page is treated as a scan and OCR'd. */
export const SCAN_TEXT_THRESHOLD = 50;

export function openPdf(bytes: Uint8Array): mupdf.PDFDocument {
  const doc = mupdf.Document.openDocument(bytes, "application/pdf");
  const pdf = doc.asPDF();
  if (!pdf) throw new Error("Not a PDF document");
  return pdf;
}

export function pageSize(doc: mupdf.Document, index: number): { width: number; height: number } {
  const [x0, y0, x1, y1] = doc.loadPage(index).getBounds();
  return { width: x1 - x0, height: y1 - y0 };
}

/** Words and their boxes from the page's text layer. */
export function extractPageText(doc: mupdf.Document, index: number): PageText {
  const page = doc.loadPage(index);
  const { width, height } = pageSize(doc, index);
  const lines: { text: string; rect: Rect }[][] = [];
  let line: { text: string; rect: Rect }[] = [];
  let word: { text: string; rect: Rect } | null = null;

  page.toStructuredText("preserve-whitespace").walk({
    beginLine() {
      line = [];
      word = null;
    },
    onChar(c, _origin, _font, _size, quad) {
      if (/\s/.test(c)) {
        word = null;
        return;
      }
      const xs = [quad[0], quad[2], quad[4], quad[6]];
      const ys = [quad[1], quad[3], quad[5], quad[7]];
      const r: Rect = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
      if (!word) {
        word = { text: "", rect: r };
        line.push(word);
      }
      word.text += c;
      word.rect = [
        Math.min(word.rect[0], r[0]),
        Math.min(word.rect[1], r[1]),
        Math.max(word.rect[2], r[2]),
        Math.max(word.rect[3], r[3]),
      ];
    },
    endLine() {
      if (line.length) lines.push(line);
    },
  });

  return buildPageText(index, width, height, lines, "pdf");
}

/** Render a page to PNG bytes at the given zoom (1 = 72 dpi). */
export function renderPagePng(doc: mupdf.Document, index: number, zoom: number): Uint8Array {
  const page = doc.loadPage(index);
  const pixmap = page.toPixmap(mupdf.Matrix.scale(zoom, zoom), mupdf.ColorSpace.DeviceRGB, false, true);
  return pixmap.asPNG();
}

/** Render a page to raw RGB pixels at the given zoom, for the OCR models. */
export function renderPageRgb(doc: mupdf.Document, index: number, zoom: number): { data: Uint8Array; width: number; height: number; channels: 3 } {
  const page = doc.loadPage(index);
  const pixmap = page.toPixmap(mupdf.Matrix.scale(zoom, zoom), mupdf.ColorSpace.DeviceRGB, false, true);
  return { data: new Uint8Array(pixmap.getPixels()), width: pixmap.getWidth(), height: pixmap.getHeight(), channels: 3 };
}

export interface RedactionItem {
  page: number;
  rects: Rect[];
  label: string;
}

const LABEL_FILL = "0.89 0.91 0.96";
const LABEL_INK = "0.25 0.29 0.38";

function pdfString(s: string): string {
  return "(" + s.replace(/[\\()]/g, (m) => "\\" + m) + ")";
}

/**
 * Remove every item from the document and draw its label in place.
 *
 * Redaction is destructive, not cosmetic: glyphs under each box are deleted
 * from the content stream and image pixels under it are overwritten, so the
 * original text cannot be copied, searched or recovered from the output.
 */
export function redactPdf(bytes: Uint8Array, items: RedactionItem[]): Uint8Array {
  const doc = openPdf(bytes);
  const byPage = new Map<number, RedactionItem[]>();
  for (const item of items) {
    if (!byPage.has(item.page)) byPage.set(item.page, []);
    byPage.get(item.page)!.push(item);
  }

  // Bake first so form fields and annotations (which may hold names) become
  // plain page content, and are therefore subject to the redactions below.
  doc.bake(true, true);

  const font = doc.addSimpleFont(new mupdf.Font("Helvetica"));
  for (const [index, pageItems] of byPage) {
    const page = doc.loadPage(index) as mupdf.PDFPage;
    const rects = pageItems.flatMap((item) => item.rects);
    // Text: the middle band of each box, so the neighbouring lines keep
    // their glyphs. Scanned pixels: the whole box.
    for (const rect of rects) page.createAnnotation("Redact").setRect(textBand(rect, 0.6));
    page.applyRedactions(
      false,
      mupdf.PDFPage.REDACT_IMAGE_NONE,
      mupdf.PDFPage.REDACT_LINE_ART_NONE,
      mupdf.PDFPage.REDACT_TEXT_REMOVE,
    );
    for (const rect of rects) page.createAnnotation("Redact").setRect(padRect(rect, 0.6));
    page.applyRedactions(
      false,
      mupdf.PDFPage.REDACT_IMAGE_PIXELS,
      mupdf.PDFPage.REDACT_LINE_ART_NONE,
      mupdf.PDFPage.REDACT_TEXT_NONE,
    );
    drawLabels(doc, page, pageItems, font);
  }

  stripDocumentMetadata(doc);
  return doc.saveToBuffer("garbage=4,compress").asUint8Array().slice();
}

function drawLabels(doc: mupdf.PDFDocument, page: mupdf.PDFPage, items: RedactionItem[], font: mupdf.PDFObject) {
  // Page space (what our rects use) -> PDF user space (what content streams use).
  const toUser = mupdf.Matrix.invert(page.getTransform());
  let ops = "q\n";
  for (const item of items) {
    for (const rect of item.rects) {
      const [x0, y0, x1, y1] = mupdf.Rect.transform(padRect(rect, 0.6), toUser);
      const w = x1 - x0;
      const h = y1 - y0;
      const size = Math.max(3, Math.min(h * 0.72, w / (0.56 * item.label.length)));
      const textWidth = 0.56 * size * item.label.length;
      ops += `${LABEL_FILL} rg ${x0.toFixed(2)} ${y0.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f\n`;
      ops += `BT ${LABEL_INK} rg /AxLabel ${size.toFixed(2)} Tf `;
      ops += `${(x0 + Math.max(0, (w - textWidth) / 2)).toFixed(2)} ${(y0 + (h - size * 0.7) / 2).toFixed(2)} Td `;
      ops += `${pdfString(item.label)} Tj ET\n`;
    }
  }
  ops += "Q\n";

  const pageObj = page.getObject();
  let resources = pageObj.getInheritable("Resources");
  if (resources.isNull()) {
    resources = doc.newDictionary();
    pageObj.put("Resources", resources);
  }
  let fonts = resources.get("Font");
  if (fonts.isNull()) {
    fonts = doc.newDictionary();
    resources.put("Font", fonts);
  }
  fonts.put("AxLabel", font);

  // Isolate the original content's graphics state from ours.
  const before = doc.addStream("q\n", {});
  const after = doc.addStream("Q\n" + ops, {});
  const contents = pageObj.get("Contents");
  const array = doc.newArray();
  array.push(before);
  if (contents.isArray()) contents.forEach((c) => array.push(c));
  else if (!contents.isNull()) array.push(contents);
  array.push(after);
  pageObj.put("Contents", array);
}

/** Remove document-level places where identifying text can hide. */
export function stripDocumentMetadata(doc: mupdf.PDFDocument) {
  doc.getTrailer().delete("Info");
  const root = doc.getTrailer().get("Root");
  for (const key of ["Metadata", "OpenAction", "AA", "AcroForm", "Outlines", "PieceInfo", "StructTreeRoot"]) {
    root.delete(key);
  }
  const names = root.get("Names");
  if (!names.isNull()) {
    names.delete("EmbeddedFiles");
    names.delete("JavaScript");
  }
  for (let i = 0; i < doc.countPages(); i++) {
    const pageObj = (doc.loadPage(i) as mupdf.PDFPage).getObject();
    for (const key of ["Annots", "AA", "Thumb", "PieceInfo", "Metadata"]) pageObj.delete(key);
  }
  // XMP packets can also sit on individual objects (images, fonts).
  for (let num = 1; num < doc.countObjects(); num++) {
    const obj = doc.newIndirect(num);
    const resolved = obj.resolve();
    if (resolved.isDictionary() || resolved.isStream()) resolved.delete("Metadata");
  }
}
