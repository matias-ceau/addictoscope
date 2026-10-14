/// <reference lib="webworker" />
/**
 * Runs the local NER model off the main thread. Model and ONNX runtime are
 * served with the app (public/models, public/vendor/ort): nothing is
 * fetched from the internet, so it also works on an offline intranet.
 */
import { AutoModelForTokenClassification, AutoTokenizer, env, type PreTrainedModel, type PreTrainedTokenizer } from "@huggingface/transformers";

import { nerSpans } from "../pii/ner";

export const NER_MODEL = "Xenova/camembert-ner";

export type NerRequest = { op: "init"; base: string } | { op: "page"; text: string };

let loaded: Promise<{ tokenizer: PreTrainedTokenizer; model: PreTrainedModel }> | null = null;

function load(base: string) {
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = new URL("models/", base).href;
  env.useBrowserCache = true;
  const onnx = env.backends.onnx;
  if (onnx.wasm) onnx.wasm.wasmPaths = new URL("vendor/ort/", base).href;
  return Promise.all([
    AutoTokenizer.from_pretrained(NER_MODEL),
    AutoModelForTokenClassification.from_pretrained(NER_MODEL, { dtype: "q8", device: "wasm" }),
  ]).then(([tokenizer, model]) => ({ tokenizer, model }));
}

self.onmessage = async (e: MessageEvent<{ id: number; req: NerRequest }>) => {
  const { id, req } = e.data;
  const reply = (msg: object) => (self as DedicatedWorkerGlobalScope).postMessage({ id, ...msg });
  try {
    if (req.op === "init") {
      loaded ??= load(req.base);
      await loaded;
      reply({ result: true });
    } else {
      if (!loaded) throw new Error("NER model not initialised");
      const { tokenizer, model } = await loaded;
      reply({ result: await nerSpans(req.text, tokenizer, model) });
    }
  } catch (err) {
    loaded = req.op === "init" ? null : loaded;
    reply({ error: String((err as Error)?.message ?? err) });
  }
};
