/**
 * A small French NER model (CamemBERT fine-tuned for PER/LOC/ORG, int8
 * ONNX) run locally to catch names the rules miss. It complements, never
 * replaces, the rules: it is case-sensitive like any cased model, so
 * lowercase names typed in a hurry ("vu par dr lemercier") stay the rules'
 * job, while unusual capitalised names with no title or kinship cue
 * ("Appelé O Pradier vallon") are where it helps.
 */
import type { PreTrainedModel, PreTrainedTokenizer, Tensor } from "@huggingface/transformers";

export type NerLabel = "PER" | "LOC" | "ORG";

export interface NerSpan {
  start: number;
  end: number;
  label: NerLabel;
  score: number;
}

/** Characters per model call; keeps inputs well under the 512-token limit. */
const CHUNK_CHARS = 900;
export const NER_MIN_SCORE = 0.6;

/** Split page text into line-aligned chunks of at most CHUNK_CHARS. */
export function chunkText(text: string): { start: number; text: string }[] {
  const chunks: { start: number; text: string }[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(text.length, start + CHUNK_CHARS);
    if (end < text.length) {
      const nl = text.lastIndexOf("\n", end);
      const sp = text.lastIndexOf(" ", end);
      end = nl > start + CHUNK_CHARS / 2 ? nl + 1 : sp > start ? sp + 1 : end;
    }
    chunks.push({ start, text: text.slice(start, end) });
    start = end;
  }
  return chunks;
}

/**
 * Map SentencePiece pieces ("▁Gar", "nier") back to character offsets in
 * `text`. Pieces are matched in order; unmatched ones (normalisation quirks)
 * get the current position so a single odd character cannot derail the rest.
 */
export function alignPieces(text: string, pieces: string[]): { start: number; end: number; wordStart: boolean }[] {
  const out: { start: number; end: number; wordStart: boolean }[] = [];
  let pos = 0;
  for (const piece of pieces) {
    const wordStart = piece.startsWith("▁");
    const body = piece.replace(/^▁/, "");
    if (!body) {
      out.push({ start: pos, end: pos, wordStart });
      continue;
    }
    let at = text.indexOf(body, pos);
    if (at < 0 || text.slice(pos, at).trim() !== "") at = pos + (text.slice(pos).match(/^\s*/)?.[0].length ?? 0);
    out.push({ start: at, end: Math.min(text.length, at + body.length), wordStart });
    pos = Math.min(text.length, at + body.length);
  }
  return out;
}

function softmax(row: Float32Array): Float32Array {
  const max = Math.max(...row);
  const exps = row.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

/** Run the model over a page's text and return entity spans in page offsets. */
export async function nerSpans(
  text: string,
  tokenizer: PreTrainedTokenizer,
  model: PreTrainedModel,
): Promise<NerSpan[]> {
  const id2label = (model.config as unknown as { id2label: Record<string, string> }).id2label;
  const spans: NerSpan[] = [];

  for (const chunk of chunkText(text)) {
    if (!/[A-ZÀ-Ý]/.test(chunk.text)) continue; // a cased model finds nothing without capitals
    const pieces = tokenizer.tokenize(chunk.text);
    const inputs = await tokenizer(chunk.text, { truncation: true, max_length: 512 });
    const { logits } = (await model(inputs)) as { logits: Tensor };
    const [, n, k] = logits.dims;
    const data = logits.data as Float32Array;
    const offsets = alignPieces(chunk.text, pieces);

    let current: (NerSpan & { scores: number[] }) | null = null;
    const flush = () => {
      if (!current) return;
      const score = current.scores.reduce((a, b) => a + b, 0) / current.scores.length;
      const value = text.slice(current.start, current.end);
      if (score >= NER_MIN_SCORE && value.replace(/[^\p{L}]/gu, "").length >= 2) {
        spans.push({ start: current.start, end: current.end, label: current.label, score });
      }
      current = null;
    };

    // Token i of `pieces` is logits row i + 1 (row 0 is <s>).
    for (let i = 0; i < pieces.length && i + 1 < n - 1; i++) {
      const probs = softmax(data.subarray((i + 1) * k, (i + 2) * k));
      let best = 0;
      for (let j = 1; j < k; j++) if (probs[j] > probs[best]) best = j;
      const label = id2label[best]?.replace(/^[BI]-/, "") as NerLabel | "O" | "MISC";
      const o = offsets[i];
      const start = chunk.start + o.start;
      const end = chunk.start + o.end;
      if (label === "PER" || label === "LOC" || label === "ORG") {
        if (current && current.label === label && start - current.end <= 1) {
          current.end = end;
          current.scores.push(probs[best]);
        } else {
          flush();
          current = { start, end, label, score: 0, scores: [probs[best]] };
        }
      } else if (current && !o.wordStart && o.end > o.start && /^\p{L}/u.test(chunk.text.slice(o.start, o.end))) {
        // Continuation piece of a word the entity started in: keep the word whole.
        current.end = end;
      } else {
        flush();
      }
    }
    flush();
  }
  return spans;
}
