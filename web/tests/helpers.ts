import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import * as ort from "onnxruntime-node";

import { charsFromOnnx, type PaddleModels } from "../src/core/paddle";

export const DATA_DIR = resolve(__dirname, "../../data/anonymized");

export function readSample(name: string): Uint8Array {
  return new Uint8Array(readFileSync(resolve(DATA_DIR, name)));
}

export const GROUND_TRUTH: Record<string, string[]> = JSON.parse(
  readFileSync(resolve(DATA_DIR, "ground_truth.json"), "utf8"),
);

const PADDLE_DIR = resolve(__dirname, "../public/models/paddleocr");
export const PADDLE_INSTALLED = existsSync(resolve(PADDLE_DIR, "PP-OCRv6_rec_small.onnx"));

/** PaddleOCR on onnxruntime-node, with the models `npm install` fetched. */
export async function loadPaddle(): Promise<PaddleModels> {
  const rec = readFileSync(resolve(PADDLE_DIR, "PP-OCRv6_rec_small.onnx"));
  return {
    det: await ort.InferenceSession.create(resolve(PADDLE_DIR, "PP-OCRv6_det_small.onnx")),
    rec: await ort.InferenceSession.create(rec),
    chars: charsFromOnnx(new Uint8Array(rec)),
    Tensor: ort.Tensor,
  };
}
