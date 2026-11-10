/**
 * A `fetch` that goes through files instead of the network, to run the
 * analysis without an API key or a paid call: each request is written as
 * `<hash>.request.md` (instruction, answer schema, message) and answered
 * from `<hash>.answer.json` once someone — an agent given that one file, a
 * person — has written it. Text only: page images are left out.
 *
 * A request without an answer yet gets an empty one, so the run goes on and
 * writes every request it can; it is listed in `pending`, and the run is to
 * be started again once the answers are there. The hash covers the model
 * name, the schema and the whole text: the same request finds its answer
 * again, any change of prompt or of text asks anew.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export interface FileTransport {
  fetchImpl: typeof fetch;
  /** Hashes of the requests written and not answered yet. */
  pending: string[];
  /** Characters answered from files so far: what an API would have billed for. */
  chars: { prompt: number; answer: number };
  /** The same, by kind of request ("segmentation", "frise", "regroupement"). */
  charsBy: Record<string, { prompt: number; answer: number }>;
}

type Part = { type: string; text?: string };
const textOf = (content: string | Part[] | undefined): string =>
  typeof content === "string" ? content : (content ?? []).flatMap((p) => (p.type === "text" && p.text ? [p.text] : [])).join("\n\n");

/** The smallest value a JSON schema accepts: what a request still waiting is answered with. */
export function emptyAnswer(schema: unknown): unknown {
  const s = (schema ?? {}) as { type?: string | string[]; anyOf?: unknown[]; required?: string[]; properties?: Record<string, unknown>; enum?: unknown[] };
  if (s.anyOf) return s.anyOf.some((o) => (o as { type?: string }).type === "null") ? null : emptyAnswer(s.anyOf[0]);
  const types = Array.isArray(s.type) ? s.type : [s.type];
  if (types.includes("null")) return null;
  if (s.enum) return s.enum[0];
  if (types.includes("object")) return Object.fromEntries((s.required ?? []).map((k) => [k, emptyAnswer(s.properties?.[k])]));
  if (types.includes("array")) return [];
  if (types.includes("boolean")) return false;
  if (types.includes("number") || types.includes("integer")) return 0;
  return "";
}

export function fileTransport(dir: string): FileTransport {
  mkdirSync(dir, { recursive: true });
  const transport: FileTransport = { fetchImpl: undefined as unknown as typeof fetch, pending: [], chars: { prompt: 0, answer: 0 }, charsBy: {} };
  transport.fetchImpl = (async (_url: unknown, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    const format = body.response_format?.json_schema ?? {};
    const [system, user] = ["system", "user"].map((role) => textOf(body.messages?.find((m: { role: string }) => m.role === role)?.content));
    const hash = createHash("sha256").update(JSON.stringify([body.model, format.name, system, user])).digest("hex").slice(0, 16);
    const answerPath = resolve(dir, `${hash}.answer.json`);
    let content: string;
    if (existsSync(answerPath)) {
      content = readFileSync(answerPath, "utf8").trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new Error(`${hash}.answer.json is not valid JSON`);
      }
      // What a paid call would carry: the schema goes with the prompt, and the
      // answer is counted without its layout, as past runs stored theirs.
      const sent = system.length + user.length + JSON.stringify(format.schema ?? {}).length;
      const received = JSON.stringify(parsed).length;
      transport.chars.prompt += sent;
      transport.chars.answer += received;
      const by = (transport.charsBy[format.name ?? ""] ??= { prompt: 0, answer: 0 });
      by.prompt += sent;
      by.answer += received;
    } else {
      writeFileSync(
        resolve(dir, `${hash}.request.md`),
        `Réponds à cette demande comme le ferait le modèle appelé par l'application : lis la consigne et le message, puis écris ta réponse dans le fichier \`${hash}.answer.json\` du même dossier — un seul objet JSON, valide selon le schéma, sans texte autour. Ne lis aucun autre fichier.\n\n` +
          `## Consigne\n\n${system}\n\n## Schéma de la réponse (${format.name})\n\n\`\`\`json\n${JSON.stringify(format.schema, null, 1)}\n\`\`\`\n\n## Message\n\n${user}\n`,
      );
      transport.pending.push(hash);
      content = JSON.stringify(emptyAnswer(format.schema));
    }
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as unknown as typeof fetch;
  return transport;
}
