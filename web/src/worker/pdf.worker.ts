/// <reference lib="webworker" />
/**
 * Owns every open PDF. Keeping MuPDF in a worker keeps the page responsive
 * on slow hospital PCs while long documents are parsed or redacted.
 */
import type * as mupdf from "mupdf";

import { toPdf } from "../core/convert";
import type { InputKind } from "../core/inputs";
import { extractPageText, openPdf, redactPdf, renderPagePng, renderPageRgb, SCAN_TEXT_THRESHOLD } from "../core/pdf";
import type { RedactionItem } from "../core/pdf";
import type { PageText } from "../core/types";

export type PdfRequest =
  | { op: "convert"; bytes: Uint8Array; kind: InputKind }
  | { op: "open"; doc: string; bytes: Uint8Array }
  | { op: "render"; doc: string; page: number; zoom: number }
  | { op: "rgb"; doc: string; page: number; zoom: number }
  | { op: "redact"; doc: string; out: string; items: RedactionItem[] }
  | { op: "close"; doc: string };

export interface OpenResult {
  pageCount: number;
  pages: PageText[];
  /** Pages whose text layer is (nearly) empty and need OCR. */
  scanned: number[];
}

const docs = new Map<string, { pdf: mupdf.PDFDocument; bytes: Uint8Array }>();

function handle(req: PdfRequest): { result: unknown; transfer?: Transferable[] } {
  switch (req.op) {
    case "convert": {
      const pdf = toPdf(req.bytes, req.kind);
      return { result: pdf, transfer: [pdf.buffer] };
    }
    case "open": {
      const pdf = openPdf(req.bytes);
      docs.set(req.doc, { pdf, bytes: req.bytes });
      const pages: PageText[] = [];
      const scanned: number[] = [];
      for (let i = 0; i < pdf.countPages(); i++) {
        const text = extractPageText(pdf, i);
        pages.push(text);
        if (text.text.replace(/\s/g, "").length < SCAN_TEXT_THRESHOLD) scanned.push(i);
      }
      const result: OpenResult = { pageCount: pdf.countPages(), pages, scanned };
      return { result };
    }
    case "render": {
      const png = renderPagePng(get(req.doc).pdf, req.page, req.zoom);
      return { result: png, transfer: [png.buffer] };
    }
    case "rgb": {
      const image = renderPageRgb(get(req.doc).pdf, req.page, req.zoom);
      return { result: image, transfer: [image.data.buffer] };
    }
    case "redact": {
      const output = redactPdf(get(req.doc).bytes, req.items);
      docs.set(req.out, { pdf: openPdf(output), bytes: output });
      return { result: output.slice() };
    }
    case "close":
      docs.delete(req.doc);
      return { result: null };
  }
}

function get(id: string) {
  const d = docs.get(id);
  if (!d) throw new Error(`Unknown document ${id}`);
  return d;
}

self.onmessage = (e: MessageEvent<{ id: number; req: PdfRequest }>) => {
  const { id, req } = e.data;
  try {
    const { result, transfer } = handle(req);
    (self as DedicatedWorkerGlobalScope).postMessage({ id, result }, transfer ?? []);
  } catch (err) {
    (self as DedicatedWorkerGlobalScope).postMessage({ id, error: String((err as Error)?.message ?? err) });
  }
};

// MuPDF loads with a top-level await: messages posted before this module has
// finished evaluating would be dropped, so tell the page when we are ready.
(self as DedicatedWorkerGlobalScope).postMessage({ ready: true });
