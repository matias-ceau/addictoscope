/**
 * Main-thread façade over the PDF worker and the OCR engine. The UI only
 * talks to this module.
 */
import { createWorker, type Worker as OcrWorker } from "tesseract.js";

import { OCR_ZOOM, ocrPage } from "../core/ocr";
import type { RedactionItem } from "../core/pdf";
import type { PageText } from "../core/types";
import type { OpenResult, PdfRequest } from "../worker/pdf.worker";

const pdfWorker = new Worker(new URL("../worker/pdf.worker.ts", import.meta.url), { type: "module" });
let nextId = 0;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
pdfWorker.onmessage = (e: MessageEvent<{ id: number; result?: unknown; error?: string }>) => {
  const p = pending.get(e.data.id);
  if (!p) return;
  pending.delete(e.data.id);
  if (e.data.error) p.reject(new Error(e.data.error));
  else p.resolve(e.data.result);
};

function call<T>(req: PdfRequest, transfer: Transferable[] = []): Promise<T> {
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    pdfWorker.postMessage({ id, req }, transfer);
  });
}

let ocr: Promise<OcrWorker> | null = null;
function getOcr(): Promise<OcrWorker> {
  const base = new URL("vendor/tesseract/", document.baseURI).href;
  ocr ??= createWorker("fra", 1, {
    workerPath: base + "worker.min.js",
    corePath: base,
    langPath: base.replace(/\/$/, ""),
    gzip: true,
    cacheMethod: "none",
  });
  return ocr;
}

export async function renderPage(doc: string, page: number, zoom: number): Promise<Blob> {
  const png = await call<Uint8Array>({ op: "render", doc, page, zoom });
  return new Blob([png as BlobPart], { type: "image/png" });
}

/**
 * Read every page: text layer where there is one, OCR where the page is a
 * scan. `onPage` reports progress after each page.
 */
export async function analyse(
  doc: string,
  bytes: Uint8Array,
  onProgress: (done: number, total: number, phase: "text" | "ocr") => void,
): Promise<PageText[]> {
  const opened = await call<OpenResult>({ op: "open", doc, bytes });
  onProgress(0, opened.scanned.length, "ocr");
  return withOcr(doc, opened, (done) => onProgress(done, opened.scanned.length, "ocr"));
}

async function withOcr(doc: string, opened: OpenResult, onPage: (done: number) => void): Promise<PageText[]> {
  const pages = [...opened.pages];
  let done = 0;
  for (const index of opened.scanned) {
    const image = await renderPage(doc, index, OCR_ZOOM);
    const { width, height } = opened.pages[index];
    pages[index] = await ocrPage(await getOcr(), image, index, width, height);
    onPage(++done);
  }
  return pages;
}

export interface RedactResult {
  output: Uint8Array;
  /** The output re-read from scratch, for verification. */
  pages: PageText[];
}

export async function redact(doc: string, items: RedactionItem[], ocrPages: number[]): Promise<RedactResult> {
  const out = `${doc}:pseudo`;
  const output = await call<Uint8Array>({ op: "redact", doc, out, items });
  const reopened = await call<OpenResult>({ op: "open", doc: out, bytes: output.slice() });
  // Re-OCR the pages that were scans, plus any page that now looks like one.
  const scanned = [...new Set([...ocrPages, ...reopened.scanned])];
  const pages = await withOcr(out, { ...reopened, scanned }, () => {});
  return { output, pages };
}

export function close(doc: string) {
  void call({ op: "close", doc });
  void call({ op: "close", doc: `${doc}:pseudo` });
}
