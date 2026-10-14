/**
 * Minimal OpenAI-compatible chat client (OpenRouter, or any HDS endpoint
 * exposing the same API). Every call goes through `assertSendable` first.
 */
import type { Manifest } from "../core/verify";
import { assertSendable, openRouterPrivacyFields, type CloudPolicy } from "./guard";

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
  schemaName: string;
  schema: object;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

export class CloudError extends Error {}

export async function chatJson<T>(call: JsonCall): Promise<T> {
  if (call.manifests.length === 0) assertSendable(undefined, call.policy);
  for (const m of call.manifests) assertSendable(m, call.policy);
  const policy = call.policy as Exclude<CloudPolicy, { kind: "off" }>;

  const url = policy.kind === "openrouter-zdr" ? OPENROUTER_URL : policy.url;
  const body = {
    model: policy.model,
    messages: call.messages,
    temperature: 0,
    response_format: { type: "json_schema", json_schema: { name: call.schemaName, strict: true, schema: call.schema } },
    ...(policy.kind === "openrouter-zdr" ? openRouterPrivacyFields() : {}),
  };
  const res = await (call.fetchImpl ?? fetch)(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${policy.apiKey}`,
      ...(policy.kind === "openrouter-zdr" ? { "X-Title": "addictoscope" } : {}),
    },
    body: JSON.stringify(body),
    signal: call.signal,
  });
  if (!res.ok) throw new CloudError(`Le modèle a répondu ${res.status} : ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) throw new CloudError("Réponse vide du modèle.");
  try {
    return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "")) as T;
  } catch {
    throw new CloudError("Réponse du modèle illisible (JSON invalide).");
  }
}
