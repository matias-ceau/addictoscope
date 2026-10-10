import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const DATA_DIR = resolve(__dirname, "../../data/anonymized");

export function readSample(name: string): Uint8Array {
  return new Uint8Array(readFileSync(resolve(DATA_DIR, name)));
}

export const GROUND_TRUTH: Record<string, string[]> = JSON.parse(
  readFileSync(resolve(DATA_DIR, "ground_truth.json"), "utf8"),
);
