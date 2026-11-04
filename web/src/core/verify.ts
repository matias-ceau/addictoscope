/**
 * The gate between local and cloud: re-read the redacted output exactly as a
 * recipient would (text layer, and OCR where the source was a scan) and
 * look for anything that should have been removed.
 */
import { foldChars } from "../pii/detect";
import { afterPlaceCue, COMMON_WORDS, isFirstName, isParticle, normaliseName } from "../pii/names";
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
 * How a leaked occurrence must be written to count: anyhow, capitalised
 * (first names double as ordinary words: "Claire" the person vs "idées
 * claires"), or in capitals (a surname that is an everyday word: "BON" the
 * patient vs "bon contact"). The detector propagates names the same way.
 */
type Spelling = "any" | "capitalised" | "upper";

/**
 * `outputPages` is the redacted document re-read from scratch. Every
 * accepted original value (and each name token of 3+ letters, particles
 * aside) must be gone, and no strong identifier pattern may remain.
 *
 * `places`: places left readable (offered, not masked). One that a person
 * also bears is not a leak where it reads as a place ("retour d'Agen"), as
 * the detector decided.
 */
export function findLeaks(outputPages: PageText[], accepted: Detection[], places: string[] = []): Leak[] {
  const placeSet = new Set(places.map(fold));
  const needles = new Map<string, Spelling>();
  for (const d of accepted) {
    if (!d.text) continue;
    needles.set(fold(d.text), "any");
    if (PERSON_CATEGORIES.has(d.category)) {
      for (const t of d.text.split(/[\s'’-]+/)) {
        if (t.length < 3 || isParticle(t)) continue;
        needles.set(fold(t), COMMON_WORDS.has(fold(t)) ? "upper" : isFirstName(t) ? "capitalised" : "any");
      }
    }
  }

  const leaks: Leak[] = [];
  for (const page of outputPages) {
    const hay = foldChars(page.text).toUpperCase().replace(/[ \t]+/g, " ");
    const orig = page.text.replace(/[ \t]+/g, " ");
    for (const [n, spelling] of needles) {
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "gu");
      let m: RegExpExecArray | null;
      while ((m = re.exec(hay))) {
        const first = orig[m.index];
        if (spelling === "capitalised" && first !== first.toUpperCase()) continue;
        const written = orig.slice(m.index, m.index + n.length);
        if (spelling === "upper" && written !== written.toUpperCase()) continue;
        if (placeSet.has(n) && afterPlaceCue(orig, m.index)) continue;
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
  places: string[] = [],
): Promise<Manifest> {
  const leaks = findLeaks(outputPages, accepted, places);
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
