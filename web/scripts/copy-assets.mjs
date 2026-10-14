// Copy the OCR engine and French model into public/ so the app never fetches
// code or models from a CDN at runtime (hospital networks, offline use).
import { cpSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nm = resolve(root, "node_modules");
const out = resolve(root, "public/vendor/tesseract");
mkdirSync(out, { recursive: true });

cpSync(resolve(nm, "tesseract.js/dist/worker.min.js"), resolve(out, "worker.min.js"));
for (const f of readdirSync(resolve(nm, "tesseract.js-core"))) {
  if (/^tesseract-core.*lstm\.wasm\.js$/.test(f)) cpSync(resolve(nm, "tesseract.js-core", f), resolve(out, f));
}
cpSync(resolve(nm, "@tesseract.js-data/fra/4.0.0_best_int/fra.traineddata.gz"), resolve(out, "fra.traineddata.gz"));
console.log("copied OCR assets to", out);
