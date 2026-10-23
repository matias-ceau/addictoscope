/**
 * Main-thread façade over the PDF worker and the OCR engine. The UI only
 * talks to this module.
 */
import { createWorker, type Worker as OcrWorker } from "tesseract.js";

import { OCR_ZOOM, ocrPage } from "../core/ocr";
import type { RgbImage } from "../core/paddle";
import type { RedactionItem } from "../core/pdf";
import type { PageText } from "../core/types";
import type { NerSpan } from "../pii/ner";
import type { NerRequest } from "../worker/ner.worker";
import type { OcrRequest } from "../worker/ocr.worker";
import type { OpenResult, PdfRequest } from "../worker/pdf.worker";

const pdfWorker = new Worker(new URL("../worker/pdf.worker.ts", import.meta.url), { type: "module" });
let nextId = 0;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
let markReady: () => void;
const pdfReady = new Promise<void>((resolve) => (markReady = resolve));
pdfWorker.onmessage = (e: MessageEvent<{ id: number; result?: unknown; error?: string; ready?: boolean }>) => {
  if (e.data.ready) return markReady();
  const p = pending.get(e.data.id);
  if (!p) return;
  pending.delete(e.data.id);
  if (e.data.error) p.reject(new Error(e.data.error));
  else p.resolve(e.data.result);
};

async function call<T>(req: PdfRequest, transfer: Transferable[] = []): Promise<T> {
  await pdfReady;
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    pdfWorker.postMessage({ id, req }, transfer);
  });
}

// --- OCR: PaddleOCR in a worker, Tesseract if its models are missing -------

const paddleWorker = new Worker(new URL("../worker/ocr.worker.ts", import.meta.url), { type: "module" });
const paddlePending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
paddleWorker.onmessage = (e: MessageEvent<{ id: number; result?: unknown; error?: string }>) => {
  const p = paddlePending.get(e.data.id);
  if (!p) return;
  paddlePending.delete(e.data.id);
  if (e.data.error) p.reject(new Error(e.data.error));
  else p.resolve(e.data.result);
};

function paddleCall<T>(req: OcrRequest, transfer: Transferable[] = []): Promise<T> {
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    paddlePending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    paddleWorker.postMessage({ id, req }, transfer);
  });
}

let paddleReady: Promise<boolean> | null = null;
function initPaddle(): Promise<boolean> {
  paddleReady ??= paddleCall<boolean>({ op: "init", base: document.baseURI }).catch((err) => {
    console.warn("PaddleOCR unavailable, falling back to Tesseract:", err);
    return false;
  });
  return paddleReady;
}

async function ocrOne(doc: string, index: number, width: number, height: number): Promise<PageText> {
  if (await initPaddle()) {
    const image = await call<RgbImage>({ op: "rgb", doc, page: index, zoom: OCR_ZOOM });
    return paddleCall<PageText>({ op: "page", image, page: index, width, height, zoom: OCR_ZOOM }, [image.data.buffer]);
  }
  return ocrPage(await getOcr(), await renderPage(doc, index, OCR_ZOOM), index, width, height);
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
    const { width, height } = opened.pages[index];
    pages[index] = await ocrOne(doc, index, width, height);
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

// --- Local NER model -------------------------------------------------------

const nerWorker = new Worker(new URL("../worker/ner.worker.ts", import.meta.url), { type: "module" });
const nerPending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
nerWorker.onmessage = (e: MessageEvent<{ id: number; result?: unknown; error?: string }>) => {
  const p = nerPending.get(e.data.id);
  if (!p) return;
  nerPending.delete(e.data.id);
  if (e.data.error) p.reject(new Error(e.data.error));
  else p.resolve(e.data.result);
};

function nerCall<T>(req: NerRequest): Promise<T> {
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    nerPending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    nerWorker.postMessage({ id, req });
  });
}

let nerReady: Promise<boolean> | null = null;

/** Load the model once; resolves false if it is not available (rules only). */
export function initNer(): Promise<boolean> {
  nerReady ??= nerCall<boolean>({ op: "init", base: document.baseURI }).catch((err) => {
    console.warn("Local NER model unavailable:", err);
    return false;
  });
  return nerReady;
}

/**
 * Run the NER model page by page (one page at a time keeps memory low on
 * small machines). Returns null if the model is unavailable.
 */
export async function runNer(
  pages: PageText[],
  onProgress: (done: number, total: number) => void,
): Promise<Record<number, NerSpan[]> | null> {
  if (!(await initNer())) return null;
  const out: Record<number, NerSpan[]> = {};
  for (const page of pages) {
    out[page.page] = await nerCall<NerSpan[]>({ op: "page", text: page.text });
    onProgress(page.page + 1, pages.length);
  }
  return out;
}
