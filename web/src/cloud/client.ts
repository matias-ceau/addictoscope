/**
 * Minimal OpenAI-compatible chat client (OpenRouter, or any HDS endpoint
 * exposing the same API). Every call goes through `assertSendable` first.
 */
import type { Manifest } from "../core/verify";
import { assertSendable, CloudRefused, openRouterPrivacyFields, type CloudPolicy } from "./guard";
import { closeEntry, messageParts, openEntry } from "./ledger";
import { isReplay } from "./replay";

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const DEFAULT_MODEL = "anthropic/claude-sonnet-5.5";

export type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export interface ChatMessage {
  role: "system" | "user";
  content: string | ContentPart[];
}

export interface JsonCall {
  policy: CloudPolicy;
  /** Manifests of every document whose content is in `messages`. */
  manifests: (Manifest | undefined)[];
  messages: ChatMessage[];
  /** App document ids whose content is in `messages` (for the journal). */
  docs?: string[];
  schemaName: string;
  schema: object;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

export class CloudError extends Error {
  /** An empty or unreadable answer: worth one more try (another provider may serve it). */
  constructor(message: string, readonly retryable = false) {
    super(message);
  }
}

/** Tries per call when the answer is empty or unreadable. */
const ATTEMPTS = 2;

export async function chatJson<T>(call: JsonCall): Promise<T> {
  const { text, images } = messageParts(call.messages);
  const replayed = isReplay(call.fetchImpl);
  const model = call.policy.kind === "off" ? "" : call.policy.model;
  const journal = {
    replayed,
    model,
    zdr: call.policy.kind === "openrouter-zdr",
    schema: call.schemaName,
    docs: call.docs ?? [],
    text,
    images,
  };
  try {
    if (call.manifests.length === 0) assertSendable(undefined, call.policy);
    for (const m of call.manifests) assertSendable(m, call.policy);
  } catch (err) {
    // Refused by the guard: journaled, nothing left the browser.
    if (err instanceof CloudRefused) openEntry({ ...journal, destination: null, bytes: 0, error: err.message }, "refused");
    throw err;
  }
  const policy = call.policy as Exclude<CloudPolicy, { kind: "off" }>;

  const url = policy.kind === "openrouter-zdr" ? OPENROUTER_URL : policy.url;
  const body = {
    model: policy.model,
    messages: call.messages,
    temperature: 0,
    response_format: { type: "json_schema", json_schema: { name: call.schemaName, strict: true, schema: call.schema } },
    ...(policy.kind === "openrouter-zdr" ? openRouterPrivacyFields() : {}),
  };
  const payload = JSON.stringify(body);
  for (let attempt = 1; ; attempt++) {
    try {
      return await send<T>(call, url, payload, { ...journal, destination: replayed ? null : new URL(url).host });
    } catch (err) {
      if (!(err instanceof CloudError && err.retryable) || replayed || attempt >= ATTEMPTS) throw err;
    }
  }
}

async function send<T>(call: JsonCall, url: string, payload: string, journal: Omit<Parameters<typeof openEntry>[0], "bytes">): Promise<T> {
  const policy = call.policy as Exclude<CloudPolicy, { kind: "off" }>;
  const entry = openEntry({ ...journal, bytes: new Blob([payload]).size });
  try {
    const res = await (call.fetchImpl ?? fetch)(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${policy.apiKey}`,
        ...(policy.kind === "openrouter-zdr" ? { "X-Title": "addictoscope" } : {}),
      },
      body: payload,
      signal: call.signal,
    });
    if (!res.ok) throw new CloudError(`Le modèle a répondu ${res.status} : ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    const answer: string | undefined = data?.choices?.[0]?.message?.content;
    if (!answer) throw new CloudError(`Réponse vide du modèle (arrêt : ${data?.choices?.[0]?.finish_reason ?? "inconnu"}).`, true);
    let parsed: T;
    try {
      parsed = JSON.parse(answer.replace(/^```(?:json)?\s*|\s*```$/g, "")) as T;
    } catch {
      throw new CloudError("Réponse du modèle illisible (JSON invalide).", true);
    }
    // With the user's own provider key (BYOK), the provider bills upstream_inference_cost.
    const reported = data?.usage?.cost || data?.usage?.cost_details?.upstream_inference_cost;
    const cost = typeof reported === "number" ? reported : undefined;
    closeEntry(entry, { status: "ok", cost });
    return parsed;
  } catch (err) {
    closeEntry(entry, { status: "error", error: String((err as Error).message ?? err) });
    throw err;
  }
}
