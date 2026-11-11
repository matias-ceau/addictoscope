/**
 * Recorded model answers, played back in place of the network: the whole
 * analysis code runs (guard, request building, checks, local age
 * resolution), only `fetch` is replaced. Used by the demonstration.
 */

export interface Recording {
  /** Model that produced the answers, e.g. "anthropic/claude-sonnet-5.5". */
  model: string;
  /** Total cost of the recorded run, in dollars. */
  cost: number;
  /** Duration of the recorded run, in milliseconds. */
  elapsedMs: number;
  /** Answers in call order, by schema name ("segmentation", "frise", "regroupement"). */
  answers: { schema: string; content: unknown }[];
  /** "rules-first": the run split the documents it recognised by rules, so it
   *  holds segmentation answers for the others only. Absent in recordings
   *  made before the rules: every document was split by the model, and an
   *  event without a start was dropped instead of placed at its first mention. */
  segmentation?: "rules-first";
}

/** Did the recorded run regroup its frise? Recordings made before did not:
 *  they are replayed without that call. */
export const hasConsolidation = (rec: Recording): boolean => rec.answers.some((a) => a.schema === "regroupement");

const replays = new WeakSet<object>();

export function isReplay(f: unknown): boolean {
  return typeof f === "function" && replays.has(f);
}

/**
 * A `fetch` that answers each call with the next recorded answer of the
 * same schema, after a short pause (`delayMs`) so progress stays visible.
 */
export function replayFetch(rec: Recording, delayMs = 0): typeof fetch {
  const next = new Map<string, number>();
  const f = async (_url: unknown, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    const schema: string = body?.response_format?.json_schema?.name ?? "";
    const i = next.get(schema) ?? 0;
    next.set(schema, i + 1);
    const answer = rec.answers.filter((a) => a.schema === schema)[i];
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    if (!answer) return new Response(`Aucune réponse enregistrée pour l'appel ${schema} n° ${i + 1}.`, { status: 404 });
    const content = typeof answer.content === "string" ? answer.content : JSON.stringify(answer.content);
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  replays.add(f);
  return f as unknown as typeof fetch;
}
