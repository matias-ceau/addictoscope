/**
 * Put the real values back in what the cloud model returned, on this
 * machine only: the table comes from the session's detections (or a
 * decrypted .axkey) and is never sent anywhere.
 */
import type { Timeline } from "../notebook/model";
import type { KeyEntry } from "./keyfile";
import type { Detection } from "./types";
import { PERSON_CATEGORIES } from "./types";

/** label ("[PATIENT]", "[SOIGNANT_2]", "[NE(E) EN 1961]") -> value shown. */
export type KeyTable = Map<string, string>;

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Strictly more complete: more words, then longer. Ties keep the first seen. */
function moreComplete(candidate: string, current: string): boolean {
  const dw = words(candidate) - words(current);
  return dw !== 0 ? dw > 0 : candidate.length > current.length;
}

const tokens = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

function pick(pairs: Iterable<[label: string, value: string, category: string]>): KeyTable {
  const table: KeyTable = new Map();
  const all = new Map<string, string[]>();
  const person = new Set<string>();
  for (const [label, raw, category] of pairs) {
    if ((PERSON_CATEGORIES as ReadonlySet<string>).has(category)) person.add(label);
    const value = raw.replace(/\s+/g, " ").trim();
    if (!label || !value) continue;
    all.set(label, [...(all.get(label) ?? []), value]);
    const current = table.get(label);
    if (current === undefined || moreComplete(value, current)) table.set(label, value);
  }
  // A label shared by different values ("[TEL]" for two numbers) stays a
  // label: one of them would be shown in place of the other. People are
  // grouped by the detector, one label per person, so their variants
  // ("GARNIER", "Odilon GARNIER") are always fine.
  for (const [label, chosen] of table) {
    if (person.has(label)) continue;
    const kept = new Set(tokens(chosen));
    if (!all.get(label)!.every((v) => tokens(v).every((t) => kept.has(t)))) table.delete(label);
  }
  return table;
}

/** Accepted detections only. Per label, the most complete value: most
 *  words, then longest, then first seen. */
export function keyTableFromDetections(dets: Detection[]): KeyTable {
  return pick(dets.filter((d) => d.accepted).map((d): [string, string, string] => [d.label, d.text, d.category]));
}

/** From a decrypted .axkey (KeyEntry[]): same choice among `values`. */
export function keyTableFromEntries(entries: KeyEntry[]): KeyTable {
  return pick(entries.flatMap((e) => e.values.map((v): [string, string, string] => [e.label, v, e.category])));
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Every occurrence of a known label replaced; unknown labels kept. */
export function reidentify(text: string, table: KeyTable): string {
  if (!text || table.size === 0) return text;
  // Longest first, in one pass: a value is never itself re-scanned.
  const labels = [...table.keys()].sort((a, b) => b.length - a.length);
  const re = new RegExp(labels.map(escape).join("|"), "g");
  return text.replace(re, (m) => table.get(m) ?? m);
}

/** Notes, track labels and undated notes re-identified; ids, dates untouched. */
export function reidentifyTimeline(t: Timeline, table: KeyTable): Timeline {
  return {
    ...t,
    tracks: t.tracks.map((x) => ({ ...x, label: reidentify(x.label, table) })),
    events: t.events.map((e) => ({ ...e, note: reidentify(e.note, table) })),
    undated: (t.undated ?? []).map((e) => ({ ...e, note: reidentify(e.note, table) })),
  };
}
