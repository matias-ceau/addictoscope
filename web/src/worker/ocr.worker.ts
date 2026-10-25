/// <reference lib="webworker" />
/**
 * Runs PaddleOCR off the main thread. Models and ONNX runtime are served
 * with the app (public/models/paddleocr, public/vendor/ort): nothing is
 * fetched from the internet.
 */
import * as ort from "onnxruntime-web";

import { charsFromOnnx, paddleOcrPage, type PaddleModels, type RgbImage } from "../core/paddle";

export const PADDLE_DET = "models/paddleocr/PP-OCRv6_det_small.onnx";
export const PADDLE_REC = "models/paddleocr/PP-OCRv6_rec_small.onnx";

export type OcrRequest =
  | { op: "init"; base: string }
  | { op: "page"; image: RgbImage; page: number; width: number; height: number; zoom: number };

let loaded: Promise<PaddleModels> | null = null;

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function load(base: string): Promise<PaddleModels> {
  ort.env.wasm.wasmPaths = new URL("vendor/ort/", base).href;
  const [det, rec] = await Promise.all([fetchBytes(new URL(PADDLE_DET, base).href), fetchBytes(new URL(PADDLE_REC, base).href)]);
  return {
    det: await ort.InferenceSession.create(det, { executionProviders: ["wasm"] }),
    rec: await ort.InferenceSession.create(rec, { executionProviders: ["wasm"] }),
    chars: charsFromOnnx(rec),
    Tensor: ort.Tensor,
  };
}

self.onmessage = async (e: MessageEvent<{ id: number; req: OcrRequest }>) => {
  const { id, req } = e.data;
  const reply = (msg: object) => (self as DedicatedWorkerGlobalScope).postMessage({ id, ...msg });
  try {
    if (req.op === "init") {
      loaded ??= load(req.base);
      await loaded;
      reply({ result: true });
    } else {
      if (!loaded) throw new Error("OCR models not initialised");
      reply({ result: await paddleOcrPage(await loaded, req.image, req.page, req.width, req.height, req.zoom) });
    }
  } catch (err) {
    reply({ error: String((err as Error)?.message ?? err) });
  }
};
