/**
 * Cloud model settings, kept in this browser only (localStorage). Fine for a
 * personal demo; a hospital deployment would hold the key in a small proxy.
 */
import { DEFAULT_MODEL } from "../cloud/client";
import type { CloudPolicy } from "../cloud/guard";

const KEY = "addictoscope.cloud";

export function loadPolicy(): CloudPolicy {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as CloudPolicy;
  } catch {
    /* storage unavailable: fall through */
  }
  return { kind: "off" };
}

export function savePolicy(policy: CloudPolicy) {
  try {
    localStorage.setItem(KEY, JSON.stringify(policy));
  } catch {
    /* storage unavailable: settings last for this session only */
  }
}

export function emptyPolicy(kind: CloudPolicy["kind"]): CloudPolicy {
  if (kind === "openrouter-zdr") return { kind, apiKey: "", model: DEFAULT_MODEL };
  if (kind === "custom-endpoint") return { kind, url: "", apiKey: "", model: "" };
  return { kind: "off" };
}

export function policyReady(p: CloudPolicy): boolean {
  if (p.kind === "off") return false;
  if (p.kind === "openrouter-zdr") return p.apiKey.trim().length > 0 && p.model.trim().length > 0;
  return /^https:\/\//.test(p.url) && p.model.trim().length > 0;
}
