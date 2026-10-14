import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { AutoModelForTokenClassification, AutoTokenizer, env, type PreTrainedModel, type PreTrainedTokenizer } from "@huggingface/transformers";
import { beforeAll, describe, expect, it } from "vitest";

import type { PageText } from "../src/core/types";
import { detectCorpus } from "../src/pii/detect";
import { alignPieces, chunkText, nerSpans } from "../src/pii/ner";

const MODELS = resolve(__dirname, "../public/models");
const hasModel = existsSync(resolve(MODELS, "Xenova/camembert-ner/onnx/model_quantized.onnx"));

describe("ner helpers", () => {
  it("aligns SentencePiece pieces to character offsets", () => {
    const text = "Vu par  Mme Garnier.";
    const o = alignPieces(text, ["▁Vu", "▁par", "▁Mme", "▁Gar", "nier", "."]);
    expect(o.map((x) => text.slice(x.start, x.end))).toEqual(["Vu", "par", "Mme", "Gar", "nier", "."]);
    expect(o.map((x) => x.wordStart)).toEqual([true, true, true, true, false, false]);
  });

  it("chunks on line boundaries and covers the whole text", () => {
    const text = Array.from({ length: 80 }, (_, i) => `Ligne numéro ${i} avec un peu de texte.`).join("\n");
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.map((c) => c.text).join("")).toBe(text);
    for (const c of chunks.slice(0, -1)) expect(c.text.endsWith("\n")).toBe(true);
  });
});

describe.runIf(hasModel)("local NER model", () => {
  let tokenizer: PreTrainedTokenizer;
  let model: PreTrainedModel;
  beforeAll(async () => {
    env.localModelPath = MODELS + "/";
    env.allowRemoteModels = false;
    tokenizer = await AutoTokenizer.from_pretrained("Xenova/camembert-ner");
    model = await AutoModelForTokenClassification.from_pretrained("Xenova/camembert-ner", { dtype: "q8" });
  });

  const page = (text: string): PageText => ({ page: 0, width: 1, height: 1, text, words: [], source: "pdf" });

  it("finds a name that no rule cues", async () => {
    const text = "Entretien téléphonique avec Odile Pradier, assistante sociale du SMPR.\nSubutex 16 mg, pas de craving.";
    const spans = await nerSpans(text, tokenizer, model);
    const people = spans.filter((s) => s.label === "PER").map((s) => text.slice(s.start, s.end));
    expect(people.join(" ")).toMatch(/Pradier/);

    const dets = detectCorpus([{ id: "d", pages: [page(text)], ner: { 0: spans } }]);
    expect(dets.find((d) => d.source === "ner" && d.accepted)?.text).toBe("Odile Pradier");
  });

  it("offers places for review without masking them by default", async () => {
    const text = "Sa mère vit à Gradignan depuis 2019.";
    const spans = await nerSpans(text, tokenizer, model);
    const dets = detectCorpus([{ id: "d", pages: [page(text)], ner: { 0: spans } }]);
    const place = dets.find((d) => d.text === "Gradignan");
    expect(place?.accepted).toBe(false);
  });

  it("does not tag drugs or clinical words as people", async () => {
    const text = "Traitement : Subutex 8 mg, Valium 10 mg, Seresta. Craving modéré, AUDIT à 18.";
    const spans = await nerSpans(text, tokenizer, model);
    expect(spans.filter((s) => s.label === "PER").map((s) => text.slice(s.start, s.end))).toEqual([]);
  });
});
