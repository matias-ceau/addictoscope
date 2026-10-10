/**
 * The gate between local and cloud: re-read the redacted output exactly as a
 * recipient would (text layer, and OCR where the source was a scan) and
 * look for anything that should have been removed.
 */
import { foldChars } from "../pii/detect";
import { isFirstName, normaliseName } from "../pii/names";
import { findRuleSpans } from "../pii/rules";
import type { Detection, PageText } from "./types";
import { PERSON_CATEGORIES } from "./types";

export interface Leak {
  page: number;
  text: string;
  reason: "known-identifier" | "residual-pattern";
}

const BLOCKING_RESIDUALS = new Set(["NIR", "IPP", "TEL", "EMAIL", "NAISSANCE"]);

function fold(s: string): string {
  return normaliseName(s).replace(/\s+/g, " ");
}

/**
 * `outputPages` is the redacted document re-read from scratch. Every
 * accepted original value (and each name token of 3+ letters) must be gone,
 * and no strong identifier pattern may remain.
 */
export function findLeaks(outputPages: PageText[], accepted: Detection[]): Leak[] {
  // value -> must the leaked occurrence be capitalised to count? (first names
  // double as ordinary words: "Claire" the person vs "idées claires")
  const needles = new Map<string, boolean>();
  for (const d of accepted) {
    if (!d.text) continue;
    needles.set(fold(d.text), false);
    if (PERSON_CATEGORIES.has(d.category)) {
      for (const t of d.text.split(/[\s'’-]+/)) if (t.length >= 3) needles.set(fold(t), isFirstName(t));
    }
  }

  const leaks: Leak[] = [];
  for (const page of outputPages) {
    const hay = foldChars(page.text).toUpperCase().replace(/[ \t]+/g, " ");
    const orig = page.text.replace(/[ \t]+/g, " ");
    for (const [n, capitalisedOnly] of needles) {
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "gu");
      let m: RegExpExecArray | null;
      while ((m = re.exec(hay))) {
        const first = orig[m.index];
        if (capitalisedOnly && first !== first.toUpperCase()) continue;
        leaks.push({ page: page.page, text: n, reason: "known-identifier" });
        break;
      }
    }
    for (const s of findRuleSpans(page.text)) {
      if (BLOCKING_RESIDUALS.has(s.category)) {
        leaks.push({ page: page.page, text: page.text.slice(s.start, s.end), reason: "residual-pattern" });
      }
    }
  }
  return leaks;
}

export interface Manifest {
  tool: "addictoscope";
  formatVersion: 1;
  createdAt: string;
  outputSha256: string;
  pages: number;
  redactions: Record<string, number>;
  ocrPages: number[];
  reviewedByHuman: boolean;
  verified: boolean;
  leaks: Leak[];
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function buildManifest(
  output: Uint8Array,
  outputPages: PageText[],
  accepted: Detection[],
  reviewedByHuman: boolean,
): Promise<Manifest> {
  const leaks = findLeaks(outputPages, accepted);
  const redactions: Record<string, number> = {};
  for (const d of accepted) redactions[d.category] = (redactions[d.category] ?? 0) + 1;
  return {
    tool: "addictoscope",
    formatVersion: 1,
    createdAt: new Date().toISOString(),
    outputSha256: await sha256Hex(output),
    pages: outputPages.length,
    redactions,
    ocrPages: outputPages.filter((p) => p.source === "ocr").map((p) => p.page),
    reviewedByHuman,
    verified: reviewedByHuman && leaks.length === 0,
    leaks,
  };
}
