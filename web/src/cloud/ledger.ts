/**
 * Journal of what left (or would have left) this browser for a remote model.
 * Every `chatJson` call is recorded here, sent, replayed or refused. The
 * journal lives in memory only: it is neither stored nor sent anywhere.
 */
import type { ChatMessage } from "./client";

export type OutboundStatus = "pending" | "ok" | "error" | "refused";

export interface OutboundEntry {
  id: number;
  startedAt: number;
  endedAt?: number;
  /** Host the request went to ("openrouter.ai"), or null when replayed. */
  destination: string | null;
  /** Answered from a recording: nothing went over the network. */
  replayed: boolean;
  model: string;
  /** Routed only to zero-data-retention providers. */
  zdr: boolean;
  /** "segmentation" or "frise". */
  schema: string;
  /** App document ids whose content is in the request. */
  docs: string[];
  /** Size of the request body, in bytes (images included). */
  bytes: number;
  /** The text of every message, system prompt included, as sent. */
  text: string;
  /** Page images (data URLs) as sent. */
  images: string[];
  status: OutboundStatus;
  error?: string;
  /** Dollars, when the provider reports it. */
  cost?: number;
}

let entries: OutboundEntry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  entries = [...entries];
  for (const l of listeners) l();
}

export function subscribeLedger(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function ledgerEntries(): OutboundEntry[] {
  return entries;
}

export function clearLedger() {
  entries = [];
  emit();
}

/** Text parts and images of the messages, as they appear in the request. */
export function messageParts(messages: ChatMessage[]): { text: string; images: string[] } {
  const texts: string[] = [];
  const images: string[] = [];
  for (const m of messages) {
    if (typeof m.content === "string") texts.push(m.content);
    else
      for (const p of m.content) {
        if (p.type === "text") texts.push(p.text);
        else images.push(p.image_url.url);
      }
  }
  return { text: texts.join("\n\n"), images };
}

export function openEntry(e: Omit<OutboundEntry, "id" | "startedAt" | "status">, status: OutboundStatus = "pending"): number {
  const id = nextId++;
  entries.push({ ...e, id, startedAt: Date.now(), status, ...(status !== "pending" ? { endedAt: Date.now() } : {}) });
  emit();
  return id;
}

export function closeEntry(id: number, patch: Partial<Pick<OutboundEntry, "status" | "error" | "cost">>) {
  const i = entries.findIndex((e) => e.id === id);
  if (i < 0) return;
  entries[i] = { ...entries[i], ...patch, endedAt: Date.now() };
  emit();
}

/**
 * Real values (as written in the original documents) found in an outbound
 * text: exact spelling, whole words. Run locally, on the reviewer's own
 * detections, to show that what was sent carries labels and no names.
 */
export function realValuesIn(text: string, values: Iterable<string>): string[] {
  const found = new Set<string>();
  for (const raw of values) {
    const v = raw.trim();
    if (v.length < 3 || found.has(v)) continue;
    const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    if (new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "u").test(text)) found.add(v);
  }
  return [...found];
}
