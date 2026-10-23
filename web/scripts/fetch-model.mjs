// Download the local models once, into public/models/, so the app can serve
// them itself. Failure is not fatal: without the NER model the app runs on
// rules only, without the OCR models it falls back to Tesseract.
import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync } from "node:fs";
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

// PaddleOCR PP-OCRv6 (multilingual, Apache-2.0), ONNX exports by RapidOCR.
// Pinned by version and checked by hash: they are fetched from ModelScope.
const PADDLE_BASE = "https://www.modelscope.cn/models/RapidAI/RapidOCR/resolve/v3.10.0/onnx/PP-OCRv6";
const PADDLE = [
  { file: "det/PP-OCRv6_det_small.onnx", sha256: "090f04abcd9d9a7498bc4ebf677e4cb9bdce1fe4197ddb7e529f1ef44e1ff94f" },
  { file: "rec/PP-OCRv6_rec_small.onnx", sha256: "6f327246b50388f3c176ae304bd95767ea6dc0c9ae92153ef8cbe210b3c14884" },
];
const paddleDir = resolve(root, "public/models/paddleocr");

try {
  mkdirSync(paddleDir, { recursive: true });
  for (const { file, sha256 } of PADDLE) {
    const target = resolve(paddleDir, file.split("/").pop());
    if (existsSync(target)) continue;
    const res = await fetch(`${PADDLE_BASE}/${file}`);
    if (!res.ok || !res.body) throw new Error(`${file}: HTTP ${res.status}`);
    await pipeline(Readable.fromWeb(res.body), createWriteStream(target + ".part"));
    const got = createHash("sha256").update(readFileSync(target + ".part")).digest("hex");
    if (got !== sha256) throw new Error(`${file}: unexpected SHA-256 ${got}`);
    renameSync(target + ".part", target);
    console.log("fetched PaddleOCR", file);
  }
} catch (err) {
  console.warn(`Could not fetch the OCR models (${err.message}); scans will be read with Tesseract.`);
}
