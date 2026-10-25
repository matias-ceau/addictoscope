/**
 * PaddleOCR (PP-OCRv6, ONNX) for image-only pages: a text detector that
 * finds every text line on the page, margins and letterhead columns
 * included, then a line recogniser. It replaces Tesseract, whose page
 * segmentation garbled multi-column letterheads, which is exactly where
 * staff names and phone numbers sit.
 *
 * Runtime-agnostic: the caller passes ONNX sessions from onnxruntime-web
 * (browser) or onnxruntime-node (tests, evaluation). Pre- and
 * post-processing follow RapidOCR's defaults.
 */
import type { InferenceSession, Tensor as OrtTensor } from "onnxruntime-common";

import { buildPageText } from "./pagetext";
import type { PageText, Rect } from "./types";

export interface PaddleModels {
  det: InferenceSession;
  rec: InferenceSession;
  /** Recogniser alphabet, without the CTC blank (index 0) or trailing space. */
  chars: string[];
  Tensor: typeof OrtTensor;
}

/** Interleaved RGB or RGBA pixels. */
export interface RgbImage {
  data: Uint8Array | Uint8ClampedArray;
  width: number;
  height: number;
  channels: 3 | 4;
}

const DET_THRESH = 0.3;
const DET_BOX_THRESH = 0.5;
const DET_UNCLIP_RATIO = 1.6;
const DET_MIN_SIDE = 736;
const REC_HEIGHT = 48;
const REC_MIN_WIDTH = 320;
const REC_BATCH = 6;
const TEXT_MIN_SCORE = 0.5;

/** Axis-aligned rect in image pixels. */
export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * A detected text line as an oriented rectangle: `(ox, oy)` is its top-left
 * corner, `(ux, uy)` the unit vector along the text, `len` x `height` its size.
 * Scans are often a little skewed; an axis-aligned box around a long tilted
 * line is mostly background, which made whole lines fail the score threshold.
 */
export interface Quad {
  ox: number;
  oy: number;
  ux: number;
  uy: number;
  len: number;
  height: number;
}

export interface OcrLine {
  text: string;
  score: number;
  box: Box;
  /** One rect per word, in image pixels. */
  words: { text: string; box: Box }[];
}

/** A channel value normalised as the models were trained: (v / 255 - 0.5) / 0.5. */
function norm(v: number): number {
  return v / 127.5 - 1;
}

/** Bounding rect of the part of `q` between s0 and s1 along the text. */
function spanBox(q: Quad, s0: number, s1: number): Box {
  const xs = [q.ox + s0 * q.ux, q.ox + s1 * q.ux].flatMap((x) => [x, x - q.height * q.uy]);
  const ys = [q.oy + s0 * q.uy, q.oy + s1 * q.uy].flatMap((y) => [y, y + q.height * q.ux]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

// --- Detection -------------------------------------------------------------

export async function detect(m: PaddleModels, img: RgbImage): Promise<Quad[]> {
  // Upscale small images, then pad (white) to multiples of 32: padding keeps
  // pixel coordinates exact, where a resize would stretch them.
  const scale = Math.min(img.width, img.height) < DET_MIN_SIDE ? DET_MIN_SIDE / Math.min(img.width, img.height) : 1;
  const w = Math.ceil((img.width * scale) / 32) * 32;
  const h = Math.ceil((img.height * scale) / 32) * 32;
  const input = new Float32Array(3 * w * h).fill(norm(255));
  const plane = w * h;
  for (let y = 0; y < Math.floor(img.height * scale); y++) {
    const sy = Math.min(img.height - 1, Math.floor(y / scale));
    for (let x = 0; x < Math.floor(img.width * scale); x++) {
      const sx = Math.min(img.width - 1, Math.floor(x / scale));
      const p = (sy * img.width + sx) * img.channels;
      const o = y * w + x;
      input[o] = norm(img.data[p + 2]); // B
      input[plane + o] = norm(img.data[p + 1]); // G
      input[2 * plane + o] = norm(img.data[p]); // R
    }
  }
  const out = await m.det.run({ [m.det.inputNames[0]]: new m.Tensor("float32", input, [1, 3, h, w]) });
  const prob = out[m.det.outputNames[0]].data as Float32Array;
  const probAt = (x: number, y: number) => prob[Math.min(h - 1, Math.max(0, Math.floor(y))) * w + Math.min(w - 1, Math.max(0, Math.floor(x)))];

  // Binarise and dilate with a 2x2 kernel, as DB post-processing does.
  const bin = new Uint8Array(plane);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (prob[i] > DET_THRESH || (x > 0 && prob[i - 1] > DET_THRESH) || (y > 0 && prob[i - w] > DET_THRESH) || (x > 0 && y > 0 && prob[i - w - 1] > DET_THRESH)) bin[i] = 1;
    }
  }

  // Connected components (8-neighbourhood), each fitted with an oriented
  // rectangle along its principal axis (the text direction).
  const seen = new Uint8Array(plane);
  const stack: number[] = [];
  const quads: Quad[] = [];
  for (let start = 0; start < plane; start++) {
    if (!bin[start] || seen[start]) continue;
    const pixels: number[] = [];
    let x0 = w, x1 = 0, y0 = h, y1 = 0;
    seen[start] = 1;
    stack.push(start);
    while (stack.length) {
      const i = stack.pop()!;
      pixels.push(i);
      const x = i % w, y = (i - x) / w;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          if (bin[j] && !seen[j]) {
            seen[j] = 1;
            stack.push(j);
          }
        }
      }
    }
    if (Math.min(x1 - x0, y1 - y0) + 1 < 3) continue;

    let mx = 0, my = 0;
    for (const i of pixels) {
      mx += (i % w) + 0.5;
      my += Math.floor(i / w) + 0.5;
    }
    mx /= pixels.length;
    my /= pixels.length;
    let angle = 0;
    // Short blobs ("Dr", a digit) have no reliable direction; nor do steep ones.
    if (x1 - x0 > 2 * (y1 - y0)) {
      let cxx = 0, cyy = 0, cxy = 0;
      for (const i of pixels) {
        const dx = (i % w) + 0.5 - mx, dy = Math.floor(i / w) + 0.5 - my;
        cxx += dx * dx;
        cyy += dy * dy;
        cxy += dx * dy;
      }
      angle = 0.5 * Math.atan2(2 * cxy, cxx - cyy);
      if (Math.abs(angle) > Math.PI / 12) angle = 0;
    }
    const ux = Math.cos(angle), uy = Math.sin(angle);
    let umin = Infinity, umax = -Infinity, vmin = Infinity, vmax = -Infinity;
    for (const i of pixels) {
      const dx = (i % w) + 0.5 - mx, dy = Math.floor(i / w) + 0.5 - my;
      const u = dx * ux + dy * uy, v = -dx * uy + dy * ux;
      if (u < umin) umin = u;
      if (u > umax) umax = u;
      if (v < vmin) vmin = v;
      if (v > vmax) vmax = v;
    }
    umin -= 0.5; umax += 0.5; vmin -= 0.5; vmax += 0.5;
    // Box score ("fast" mode): mean probability inside the rectangle.
    let sum = 0, n = 0;
    for (let v = vmin + 0.5; v < vmax; v++) {
      for (let u = umin + 0.5; u < umax; u++) {
        sum += probAt(mx + u * ux - v * uy, my + u * uy + v * ux);
        n++;
      }
    }
    if (!n || sum / n < DET_BOX_THRESH) continue;
    // Unclip: the model predicts shrunk text kernels.
    const L = umax - umin, H = vmax - vmin;
    const d = (L * H * DET_UNCLIP_RATIO) / (2 * (L + H));
    // Top-left corner is (umin - d, vmin - d) in the (u, v) frame, v = (-uy, ux).
    const quad: Quad = {
      ox: (mx + (umin - d) * ux - (vmin - d) * uy) / scale,
      oy: (my + (umin - d) * uy + (vmin - d) * ux) / scale,
      ux,
      uy,
      len: (L + 2 * d) / scale,
      height: (H + 2 * d) / scale,
    };
    if (Math.min(quad.len, quad.height) < 5) continue;
    quads.push(quad);
  }
  return quads;
}

// --- Recognition -----------------------------------------------------------

/** Bilinear sampling of `q` resized to REC_HEIGHT, into a CHW slot of width `slotW`. */
function cropInto(img: RgbImage, q: Quad, outW: number, slotW: number, dst: Float32Array, offset: number): void {
  const plane = REC_HEIGHT * slotW;
  const clampX = (x: number) => Math.min(img.width - 1, Math.max(0, x));
  const clampY = (y: number) => Math.min(img.height - 1, Math.max(0, y));
  for (let y = 0; y < REC_HEIGHT; y++) {
    const t = ((y + 0.5) * q.height) / REC_HEIGHT;
    for (let x = 0; x < outW; x++) {
      const s = ((x + 0.5) * q.len) / outW;
      const fx = clampX(q.ox + s * q.ux - t * q.uy - 0.5);
      const fy = clampY(q.oy + s * q.uy + t * q.ux - 0.5);
      const x0 = Math.floor(fx), x1 = Math.min(img.width - 1, x0 + 1), tx = fx - x0;
      const y0 = Math.floor(fy), y1 = Math.min(img.height - 1, y0 + 1), ty = fy - y0;
      for (let c = 0; c < 3; c++) {
        const at = (yy: number, xx: number) => img.data[(yy * img.width + xx) * img.channels + c];
        const v = (at(y0, x0) * (1 - tx) + at(y0, x1) * tx) * (1 - ty) + (at(y1, x0) * (1 - tx) + at(y1, x1) * tx) * ty;
        dst[offset + (2 - c) * plane + y * slotW + x] = norm(v); // RGB -> BGR planes
      }
    }
  }
}

export async function recognise(m: PaddleModels, img: RgbImage, quads: Quad[]): Promise<OcrLine[]> {
  const ratio = (q: Quad) => q.len / q.height;
  const order = quads.map((_, i) => i).sort((a, b) => ratio(quads[a]) - ratio(quads[b]));
  const lines: (OcrLine | null)[] = quads.map(() => null);
  for (let s = 0; s < order.length; s += REC_BATCH) {
    const batch = order.slice(s, s + REC_BATCH);
    const widths = batch.map((i) => Math.max(1, Math.ceil(REC_HEIGHT * ratio(quads[i]))));
    const slotW = Math.max(REC_MIN_WIDTH, ...widths);
    const input = new Float32Array(batch.length * 3 * REC_HEIGHT * slotW);
    batch.forEach((i, k) => cropInto(img, quads[i], widths[k], slotW, input, k * 3 * REC_HEIGHT * slotW));
    const out = await m.rec.run({ [m.rec.inputNames[0]]: new m.Tensor("float32", input, [batch.length, 3, REC_HEIGHT, slotW]) });
    const t = out[m.rec.outputNames[0]];
    const [, steps, classes] = t.dims as number[];
    const probs = t.data as Float32Array;
    batch.forEach((i, k) => {
      lines[i] = decode(m.chars, probs, k * steps * classes, steps, classes, quads[i], widths[k], slotW);
    });
  }
  return lines.filter((l): l is OcrLine => !!l && l.text.trim() !== "" && l.score >= TEXT_MIN_SCORE);
}

/** Greedy CTC decoding; word rects come from the time steps of their characters. */
function decode(chars: string[], p: Float32Array, base: number, steps: number, classes: number, q: Quad, contentW: number, slotW: number): OcrLine {
  const decoded: { ch: string; step: number; prob: number }[] = [];
  let prev = -1;
  for (let t = 0; t < steps; t++) {
    let best = 0, bestP = -Infinity;
    const row = base + t * classes;
    for (let c = 0; c < classes; c++) {
      if (p[row + c] > bestP) {
        bestP = p[row + c];
        best = c;
      }
    }
    if (best !== 0 && best !== prev) decoded.push({ ch: best - 1 < chars.length ? chars[best - 1] : " ", step: t, prob: bestP });
    prev = best;
  }
  const text = decoded.map((d) => d.ch).join("");
  const score = decoded.length ? decoded.reduce((s, d) => s + d.prob, 0) / decoded.length : 0;
  // Time step -> distance along the line: steps span the padded slot, the text only `contentW` of it.
  const stepPx = slotW / steps;
  const toS = (step: number) => (Math.min(step * stepPx, contentW) / contentW) * q.len;
  // Word rects tile the line, split halfway between the last letter of one word
  // and the first of the next: masking a word never leaves a sliver of its
  // edge letters visible, as tight per-letter bounds did on scans.
  const groups: (typeof decoded)[] = [];
  let cur: typeof decoded = [];
  for (const d of decoded) {
    if (/\s/.test(d.ch)) {
      if (cur.length) groups.push(cur);
      cur = [];
    } else cur.push(d);
  }
  if (cur.length) groups.push(cur);
  const words = groups.map((g, i) => ({
    text: g.map((d) => d.ch).join(""),
    box: spanBox(
      q,
      i === 0 ? 0 : toS((groups[i - 1].at(-1)!.step + g[0].step + 1) / 2),
      i === groups.length - 1 ? q.len : toS((g.at(-1)!.step + groups[i + 1][0].step + 1) / 2),
    ),
  }));
  return { text, score, box: spanBox(q, 0, q.len), words };
}

// --- Page ------------------------------------------------------------------

export async function paddleLines(m: PaddleModels, img: RgbImage): Promise<OcrLine[]> {
  const lines = await recognise(m, img, await detect(m, img));
  // Reading order: rows top to bottom (a row = overlapping vertical spans), then left to right.
  lines.sort((a, b) => a.box.y0 - b.box.y0);
  const rows: OcrLine[][] = [];
  for (const l of lines) {
    const row = rows.at(-1);
    const mid = (l.box.y0 + l.box.y1) / 2;
    if (row && mid < Math.min(...row.map((r) => r.box.y1))) row.push(l);
    else rows.push([l]);
  }
  return rows.flatMap((r) => r.sort((a, b) => a.box.x0 - b.box.x0));
}

/** OCR one page image rendered at `zoom`, into page coordinates (points). */
export async function paddleOcrPage(m: PaddleModels, img: RgbImage, page: number, width: number, height: number, zoom: number): Promise<PageText> {
  const lines = (await paddleLines(m, img)).map((l) =>
    l.words.map((w) => ({ text: w.text, rect: [w.box.x0 / zoom, w.box.y0 / zoom, w.box.x1 / zoom, w.box.y1 / zoom] as Rect })),
  );
  return buildPageText(page, width, height, lines, "ocr");
}

/** Read the alphabet stored in the recogniser's ONNX metadata ("character"). */
export function charsFromOnnx(bytes: Uint8Array): string[] {
  // ModelProto.metadata_props = field 14, StringStringEntryProto {key = 1, value = 2}.
  const td = new TextDecoder();
  let pos = 0;
  const varint = () => {
    let v = 0, shift = 0, b: number;
    do {
      b = bytes[pos++];
      v += (b & 0x7f) * 2 ** shift;
      shift += 7;
    } while (b & 0x80);
    return v;
  };
  while (pos < bytes.length) {
    const tag = varint();
    const field = Math.floor(tag / 8), wire = tag % 8;
    if (wire === 0) varint();
    else if (wire === 1) pos += 8;
    else if (wire === 5) pos += 4;
    else if (wire === 2) {
      const len = varint();
      if (field === 14) {
        const end = pos + len;
        let key = "", value = "";
        while (pos < end) {
          const t = varint();
          const l = varint();
          const s = td.decode(bytes.subarray(pos, pos + l));
          pos += l;
          if (t >> 3 === 1) key = s;
          else if (t >> 3 === 2) value = s;
        }
        if (key === "character") return value.split("\n");
      } else pos += len;
    } else throw new Error(`unsupported protobuf wire type ${wire}`);
  }
  throw new Error("no 'character' metadata in recogniser model");
}
