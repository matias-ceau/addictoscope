// Download the local NER model once, into public/models/, so the app can
// serve it itself. Failure is not fatal: the app then runs on rules only.
import { createWriteStream, existsSync, mkdirSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const MODEL = "Xenova/camembert-ner";
const REVISION = "8e1988247e872ba0137062653b1e5033a31e14fc";
const FILES = ["config.json", "tokenizer.json", "tokenizer_config.json", "special_tokens_map.json", "onnx/model_quantized.onnx"];

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = resolve(root, "public/models", MODEL);

try {
  for (const file of FILES) {
    const target = resolve(dir, file);
    if (existsSync(target)) continue;
    mkdirSync(dirname(target), { recursive: true });
    const res = await fetch(`https://huggingface.co/${MODEL}/resolve/${REVISION}/${file}`);
    if (!res.ok || !res.body) throw new Error(`${file}: HTTP ${res.status}`);
    await pipeline(Readable.fromWeb(res.body), createWriteStream(target + ".part"));
    renameSync(target + ".part", target);
    console.log("fetched", MODEL, file);
  }
} catch (err) {
  console.warn(`Could not fetch the NER model (${err.message}); the app will use rules only.`);
}
