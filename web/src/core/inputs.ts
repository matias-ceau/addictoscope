/**
 * Which files the app takes, told apart without loading MuPDF (this runs on
 * the main thread). Conversion itself is in convert.ts, in the PDF worker.
 */
export type InputKind = "pdf" | "docx" | "text";

/** For file pickers. */
export const ACCEPTED_FILES = ".pdf,.txt,.md,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Tell PDFs, Word documents and plain text apart; null for anything else (old .doc, images...). */
export function inputKind(name: string, bytes: Uint8Array): InputKind | null {
  const lower = name.toLowerCase();
  const starts = (s: string) => [...s].every((c, i) => bytes[i] === c.charCodeAt(0));
  if (starts("%PDF")) return "pdf";
  if (starts("PK\x03\x04")) return lower.endsWith(".docx") ? "docx" : null;
  if (lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".text")) return "text";
  return null;
}

/** UTF-8 if it is valid UTF-8 (with or without BOM), else Windows-1252, as older exports are. */
export function decodeText(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}
