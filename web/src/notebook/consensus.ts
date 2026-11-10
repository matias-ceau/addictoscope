/**
 * Frise by consensus (SPEC.md): several cheap models read the same
 * observations; what they all find, compatibly, is kept; a stronger model
 * settles only the disagreements, seeing only the observations they cite.
 *
 * Event matching mirrors src/addictoscope/frise_eval.py (label words,
 * synonyms, compatible dates), so what the app calls an agreement is what the
 * evaluation calls a match.
 */
import { chatJson, CloudError } from "../cloud/client";
import type { CloudPolicy } from "../cloud/guard";
import { parseAge } from "./age";
import { dateEnd, dateStart, isPartialDate, type ConsensusStats, type Timeline } from "./model";
import {
  assembleTimeline,
  CHARS_PER_CALL,
  lastObservationDate,
  observationDates,
  prepareObservations,
  readEvents,
  TIMELINE_SCHEMA,
  type PreparedObservations,
  type RawEvent,
  type TimelineInput,
} from "./timeline";

export interface ConsensusPolicy {
  readers: CloudPolicy[];
  arbiter: CloudPolicy;
}

/** One event as each reading saw it (null: that reading does not have it). */
export interface EventGroup {
  id: string;
  members: (RawEvent | null)[];
  /** Every reading has it, and all agree on track, start and mode. */
  agreed: boolean;
}

export type { ConsensusStats };

// --- Labels (frise_eval.py) -------------------------------------------------

const STOPWORDS = new Set("a au aux avec d de des du en et hors l la le les par pour sa sans son ses sur un une".split(" "));
const SYNONYMS = [
  ["opioides", "opioide", "opiaces", "opiace", "heroine"],
  ["benzodiazepines", "benzodiazepine", "bzd", "clonazepam", "rivotril"],
  ["cocaine", "crack"],
  ["cannabis", "thc"],
  ["alcool", "oh"],
  ["tabac", "cigarettes", "tabagisme"],
  ["vhc", "hepatite"],
  ["tdah", "hyperactivite"],
  ["overdose", "od", "surdose"],
  ["psychotherapie", "tcc", "psychologique", "psychologue"],
  ["hospitalisation", "hospitalisee", "hospitalise"],
  ["deces", "deuil", "mort"],
  ["naissance", "nee"],
  ["incarceration", "detention", "prison"],
  ["rupture", "separation", "separee", "separe"],
  ["substituts", "patchs", "patch", "tsn"],
];
const GENERIC = new Set(["suivi", "consultation", "consultations", "prise", "charge", "episode", "trouble", "accompagnement"]);
const CANON = new Map(SYNONYMS.flatMap((g) => g.map((w) => [w, [...g].sort()[0]] as const)));
const PHRASES: [RegExp, string][] = [
  [/\bintoxication medicamenteuse volontaire\b/g, "tentative suicide"],
  [/\bimv\b/g, "tentative suicide"],
  [/\bconsultation jeunes consommateurs\b/g, "cjc"],
  [/\breduction des risques\b/g, "rdr"],
];

function labelTokens(label: string): Set<string> {
  let text = (label.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().match(/[a-z0-9]+/g) ?? []).join(" ");
  for (const [re, alias] of PHRASES) text = text.replace(re, alias);
  const words = text.split(" ").filter((w) => w && !STOPWORDS.has(w));
  const specific = words.filter((w) => !GENERIC.has(w));
  return new Set((specific.length ? specific : words).map((w) => CANON.get(w) ?? w.slice(0, 6)));
}

/** Share of the shorter label's words found in the other one. */
export function labelSimilarity(a: string, b: string): number {
  const ta = labelTokens(a);
  const tb = labelTokens(b);
  if (!ta.size || !tb.size) return 0;
  let common = 0;
  for (const w of ta) if (tb.has(w)) common++;
  return common / Math.min(ta.size, tb.size);
}

// --- Matching ---------------------------------------------------------------

const DAY = 86_400_000;
/** Slack around a start date: a month either way. */
const SLACK = 31 * DAY;

function startsCompatible(a: RawEvent, b: RawEvent): boolean {
  if (isPartialDate(a.start) && isPartialDate(b.start)) {
    return dateStart(a.start) <= dateEnd(b.start) + SLACK && dateEnd(a.start) >= dateStart(b.start) - SLACK;
  }
  if (isPartialDate(a.start) || isPartialDate(b.start)) return false;
  const x = parseAge(a.start_age);
  const y = parseAge(b.start_age);
  return x !== null && y !== null && x[0] <= y[1] && x[1] >= y[0];
}

function startGap(a: RawEvent, b: RawEvent): number {
  if (isPartialDate(a.start) && isPartialDate(b.start)) return Math.abs(dateStart(a.start) - dateStart(b.start)) / DAY;
  const x = parseAge(a.start_age);
  const y = parseAge(b.start_age);
  return x && y ? Math.abs(x[0] - y[0]) * 365 : 3650;
}

const sameMode = (a: RawEvent, b: RawEvent) => a.kind !== "substance_use" || (a.mode ?? null) === (b.mode ?? null);

/** Same event, read the same way: what an agreement requires of every pair. */
function compatible(a: RawEvent, b: RawEvent): boolean {
  return a.kind === b.kind && labelSimilarity(a.label, b.label) >= 0.5 && startsCompatible(a, b) && sameMode(a, b);
}

/** Higher is a better pairing; null if the two cannot be the same event. */
function pairScore(a: RawEvent, b: RawEvent): number | null {
  const sim = labelSimilarity(a.label, b.label);
  if (sim < 0.5) return null;
  const sameKind = a.kind === b.kind;
  const start = startsCompatible(a, b);
  const shared = (a.observation_ids ?? []).some((id) => (b.observation_ids ?? []).includes(id));
  // Without a shared source, only an event of the same track and start can be the same one.
  if (!shared && !(sameKind && start)) return null;
  // Two modes of one substance at one date are two events, not a dispute.
  if (sameKind && start && !sameMode(a, b) && !shared) return null;
  return sim + (sameKind ? 1 : 0) + (start ? 1 : 0) + (sameMode(a, b) ? 0.5 : 0) + (shared ? 0.5 : 0) - Math.min(startGap(a, b), 3650) / 36500;
}

const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** One reading's events with exact repeats (the same event from two batches) merged. */
function dedupe(run: RawEvent[]): RawEvent[] {
  const byKey = new Map<string, RawEvent>();
  for (const e of run) {
    const key = JSON.stringify([e.kind, norm(e.label), e.start, e.end, e.start_age ?? null, e.mode ?? null]);
    const seen = byKey.get(key);
    if (seen) seen.observation_ids = [...new Set([...seen.observation_ids, ...(e.observation_ids ?? [])])];
    else byKey.set(key, { ...e, observation_ids: [...(e.observation_ids ?? [])] });
  }
  return [...byKey.values()];
}

/** Match the events of several readings one to one, best pairing first. */
export function groupEvents(runs: RawEvent[][]): EventGroup[] {
  const groups: (RawEvent | null)[][] = [];
  runs.forEach((run, r) => {
    const events = dedupe(run);
    const pairs: [number, number, number][] = [];
    events.forEach((e, ei) =>
      groups.forEach((g, gi) => {
        let best: number | null = null;
        for (const m of g) {
          const s = m ? pairScore(m, e) : null;
          if (s !== null && (best === null || s > best)) best = s;
        }
        if (best !== null) pairs.push([best, ei, gi]);
      }),
    );
    pairs.sort((x, y) => y[0] - x[0]);
    const usedEvent = new Set<number>();
    const usedGroup = new Set<number>();
    for (const [, ei, gi] of pairs) {
      if (usedEvent.has(ei) || usedGroup.has(gi)) continue;
      groups[gi][r] = events[ei];
      usedEvent.add(ei);
      usedGroup.add(gi);
    }
    events.forEach((e, ei) => {
      if (usedEvent.has(ei)) return;
      const g: (RawEvent | null)[] = Array(runs.length).fill(null);
      g[r] = e;
      groups.push(g);
    });
    for (const g of groups) if (g.length < runs.length) g.length = runs.length;
  });
  return groups.map((g, i) => {
    const members = Array.from({ length: runs.length }, (_, r) => g[r] ?? null);
    const present = members.filter((m): m is RawEvent => m !== null);
    const agreed = present.length === runs.length && present.every((a) => present.every((b) => a === b || compatible(a, b)));
    return { id: `g${i + 1}`, members, agreed };
  });
}

/** An agreed group as one event: the most precise dates, every source. */
export function mergeAgreed(members: RawEvent[]): RawEvent {
  const precision = (s: string | null) => (isPartialDate(s) ? s.length : 0);
  const base = [...members].sort((a, b) => precision(b.start) - precision(a.start))[0];
  const end = [...members].map((m) => m.end).sort((a, b) => precision(b) - precision(a))[0] ?? null;
  return {
    ...base,
    end: isPartialDate(end) ? end : base.end,
    observation_ids: [...new Set(members.flatMap((m) => m.observation_ids ?? []))],
  };
}

// --- Arbitration ------------------------------------------------------------

export const ARBITER_SYSTEM = `Tu arbitres les désaccords entre plusieurs lectures d'un même dossier d'addictologie, pour une frise chronologique (modèle Auriacombe et al., 2018). Les observations sont pseudonymisées : garde les étiquettes ([PATIENT], [SOIGNANT_2]…) telles quelles.

Tu reçois les seules observations concernées, puis une ligne JSON par désaccord : son identifiant et les variantes proposées par les lectures (un événement chacune, même format que la frise).

Pour chaque désaccord, réponds :
- verdict « keep » si l'événement est écrit dans les observations citées ; variant = le numéro (1, 2…) de la variante fidèle au texte ; event = null, sauf si aucune variante n'est juste : event = l'événement corrigé (piste, libellé, dates à la précision réellement connue, mode, observation_ids) ;
- verdict « drop » si les observations ne l'étayent pas (variant = null, event = null).
Règles de la frise : un événement = une période (start, end) ou un point ; antécédent daté seulement par l'âge : start = null et start_age (ne calcule jamais l'année) ; observation_ids parmi les observations fournies. N'invente rien. Réponds pour chaque identifiant.`;

const EVENT_SCHEMA = TIMELINE_SCHEMA.properties.events.items;

export const ARBITRATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["decisions"],
  properties: {
    decisions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "verdict", "variant", "event"],
        properties: {
          id: { type: "string" },
          verdict: { type: "string", enum: ["keep", "drop"] },
          variant: { type: ["integer", "null"] },
          event: { anyOf: [EVENT_SCHEMA, { type: "null" }] },
        },
      },
    },
  },
};

interface Dispute {
  id: string;
  variants: RawEvent[];
  /** App observation ids cited by the variants (known ones only). */
  sources: string[];
}

type Decision = { id: string; verdict: "keep" | "drop"; variant?: number | null; event: RawEvent | null };

/** Disputes and the observations they cite, packed into calls of bounded size. */
function packDisputes(disputes: Dispute[], prepared: PreparedObservations, limit: number) {
  const order = new Map(prepared.sorted.map((o, i) => [o.id, i]));
  const first = (d: Dispute) => Math.min(...d.sources.map((s) => order.get(s) ?? Infinity));
  const batches: { disputes: Dispute[]; observations: Set<string>; size: number }[] = [];
  for (const d of [...disputes].sort((a, b) => first(a) - first(b))) {
    const last = batches.at(-1);
    const added = (b: { observations: Set<string> } | undefined) =>
      d.sources.filter((s) => !b?.observations.has(s)).reduce((n, s) => n + (prepared.text.get(s)?.length ?? 0), 0) +
      JSON.stringify(d.variants).length;
    if (last && last.size + added(last) <= limit) {
      last.size += added(last);
      last.disputes.push(d);
      for (const s of d.sources) last.observations.add(s);
    } else batches.push({ disputes: [d], observations: new Set(d.sources), size: added(undefined) });
  }
  return batches;
}

/** Decisions of the arbiter by dispute id; an unusable answer gives none. */
async function arbitrate(
  input: TimelineInput,
  arbiter: CloudPolicy,
  disputes: Dispute[],
  prepared: PreparedObservations,
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, Decision>> {
  const decisions = new Map<string, Decision>();
  const docOf = new Map(input.observations.map((o) => [o.id, o.doc]));
  const toShort = (e: RawEvent) => ({ ...e, observation_ids: e.observation_ids.map((id) => prepared.shortId.get(id) ?? id) });
  const batches = packDisputes(disputes, prepared, input.charsPerCall ?? CHARS_PER_CALL);
  let done = 0;
  for (const batch of batches) {
    const obsText = prepared.sorted.filter((o) => batch.observations.has(o.id)).map((o) => prepared.text.get(o.id)).join("\n\n");
    const lines = batch.disputes.map((d) => JSON.stringify({ id: d.id, variants: d.variants.map(toShort) })).join("\n");
    const docs = [...new Set([...batch.observations].map((id) => docOf.get(id)!))];
    try {
      const answer = await chatJson<{ decisions: Decision[] }>({
        policy: arbiter,
        manifests: docs.map((d) => input.manifests[d]),
        messages: [
          { role: "system", content: ARBITER_SYSTEM },
          { role: "user", content: `Observations :\n\n${obsText}\n\nDésaccords (une ligne par désaccord) :\n${lines}` },
        ],
        docs,
        schemaName: "arbitrage",
        schema: ARBITRATION_SCHEMA,
        fetchImpl: input.fetchImpl,
      });
      const known = new Set(batch.disputes.map((d) => d.id));
      for (const d of answer.decisions ?? []) {
        if (!known.has(d.id) || (d.verdict !== "keep" && d.verdict !== "drop")) continue;
        decisions.set(d.id, {
          ...d,
          event: d.event ? { ...d.event, observation_ids: (d.event.observation_ids ?? []).map((id) => prepared.realId.get(id) ?? id) } : null,
        });
      }
    } catch (err) {
      // The guard's refusal stops everything; a failed or unreadable answer
      // leaves this batch's disputes unarbitrated, kept as read.
      if (!(err instanceof CloudError)) throw err;
    }
    onProgress?.(++done, batches.length);
  }
  return decisions;
}

// --- Whole frise ------------------------------------------------------------

export async function buildConsensusTimeline(
  input: TimelineInput & {
    consensus: ConsensusPolicy;
    /** Each reading's raw events, for evaluation scripts. */
    onReadings?: (runs: RawEvent[][]) => void;
  },
): Promise<Timeline & { consensus: ConsensusStats }> {
  const { readers, arbiter } = input.consensus;
  const prepared = prepareObservations(input);
  const known = new Set(input.observations.map((o) => o.id));

  const progress = readers.map(() => ({ done: 0, total: 1 }));
  const report = () =>
    input.onProgress?.(
      progress.reduce((n, p) => n + p.done, 0),
      progress.reduce((n, p) => n + p.total, 0),
    );
  const runs = await Promise.all(
    readers.map((policy, r) =>
      readEvents(
        {
          ...input,
          policy,
          onProgress: (done, total) => {
            progress[r] = { done, total };
            report();
          },
        },
        prepared,
      ),
    ),
  );

  input.onReadings?.(runs);
  const groups = groupEvents(runs);
  const kept: RawEvent[] = [];
  const disputes: Dispute[] = [];
  for (const g of groups) {
    const present = g.members.filter((m): m is RawEvent => m !== null);
    if (g.agreed) kept.push({ ...mergeAgreed(present), consensus: "agreed" });
    else
      disputes.push({
        id: `d${disputes.length + 1}`,
        variants: present,
        sources: [...new Set(present.flatMap((m) => m.observation_ids ?? []))].filter((id) => known.has(id)),
      });
  }

  const stats: ConsensusStats = { readers: readers.length, agreed: kept.length, disputed: disputes.length, kept: 0, dropped: 0, unarbitrated: 0 };
  const withSources = disputes.filter((d) => d.sources.length > 0);
  const decisions = withSources.length ? await arbitrate(input, arbiter, withSources, prepared) : new Map<string, Decision>();
  for (const d of disputes) {
    if (d.sources.length === 0) continue; // nothing on the frise without a source
    const decision = decisions.get(d.id);
    if (!decision) {
      stats.unarbitrated++;
      kept.push({ ...d.variants[0], consensus: "unarbitrated" });
    } else if (decision.verdict === "drop") stats.dropped++;
    else {
      stats.kept++;
      const chosen = typeof decision.variant === "number" ? d.variants[decision.variant - 1] : undefined;
      const event = decision.event ?? chosen ?? d.variants[0];
      // A correction citing no known observation keeps the dispute's sources.
      const sources = event.observation_ids.filter((id) => known.has(id));
      kept.push({ ...event, observation_ids: sources.length ? sources : d.sources, consensus: "arbitrated" });
    }
  }

  const timeline = assembleTimeline(kept, known, input.birthYear ?? null, lastObservationDate(input.observations), input.placeUnknownStarts === false ? undefined : observationDates(input.observations));
  return { ...timeline, consensus: stats };
}

