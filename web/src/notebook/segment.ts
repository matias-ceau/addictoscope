/**
 * Split a pseudonymized document into its clinical observations with a
 * multimodal model. The model sees each page image (so it can tell a
 * repeated header box from content, and a page break from the end of an
 * observation) plus the numbered text lines it must cite. Deterministic
 * code then checks and repairs what comes back.
 */
import type { CloudPolicy } from "../cloud/guard";
import { chatJson, type ContentPart } from "../cloud/client";
import type { PageText } from "../core/types";
import type { Manifest } from "../core/verify";
import { formatLines, isRepeated, pageLines, repeatedLines } from "./lines";
import { isPartialDate, type Observation } from "./model";

export const PAGES_PER_CALL = 3;

const anchor = {
  type: "object",
  additionalProperties: false,
  required: ["page", "line"],
  properties: { page: { type: "integer" }, line: { type: "integer" } },
};

export const SEGMENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["observations"],
  properties: {
    observations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["start", "end", "date", "kind", "author_role", "continues_previous", "summary"],
        properties: {
          start: anchor,
          end: anchor,
          date: { type: ["string", "null"], description: "YYYY-MM-DD, date de la consultation" },
          kind: { type: "string" },
          author_role: { type: ["string", "null"] },
          continues_previous: { type: "boolean" },
          summary: { type: "string" },
        },
      },
    },
  },
};

interface RawObservation {
  start: { page: number; line: number };
  end: { page: number; line: number };
  date: string | null;
  kind: string;
  author_role: string | null;
  continues_previous: boolean;
  summary: string;
}

export const SEGMENT_SYSTEM = `Tu aides un clinicien en addictologie à structurer un dossier patient PDF déjà pseudonymisé (les noms sont remplacés par des étiquettes comme [PATIENT] ou [SOIGNANT_2] : garde-les tels quels).

Le dossier est une suite d'observations cliniques (consultations, entretiens, notes infirmières, courriers, comptes rendus). Pour chaque observation, rends :
- start / end : première et dernière ligne de l'observation (titre compris), en numéros de page et de ligne tels qu'ils sont donnés (p3 L12 → page 3, line 12) ;
- date : date clinique de la rencontre (YYYY-MM-DD), jamais la date de validation, d'édition ou d'impression ; null si absente ;
- kind : type d'observation tel qu'écrit (ex. « psychiatrique de suivi », « IDE », « courrier de sortie ») ;
- author_role : fonction de l'auteur si elle est indiquée ou évidente, sinon null ;
- continues_previous : true seulement si la première observation de ces pages est la suite d'une observation commencée avant ces pages ;
- summary : une phrase, en français, factuelle.

Les en-têtes et pieds de page répétés à chaque page (encadré d'identité, adresse de l'établissement, « Page x/y », mentions d'édition) ne font partie d'aucune observation : une observation coupée par un saut de page continue après l'encadré de la page suivante. Utilise les images pour reconnaître la mise en page. Ne crée pas d'observation pour un en-tête seul.`;

export interface SegmentInput {
  doc: string;
  pages: PageText[];
  /** PNG data URLs of the pseudonymized pages, by page index. */
  images: Record<number, string>;
  manifest: Manifest | undefined;
  policy: CloudPolicy;
  onProgress?: (done: number, total: number) => void;
  fetchImpl?: typeof fetch;
}

export async function segmentDocument(input: SegmentInput): Promise<Observation[]> {
  const repeated = repeatedLines(input.pages);
  const batches: PageText[][] = [];
  for (let i = 0; i < input.pages.length; i += PAGES_PER_CALL) batches.push(input.pages.slice(i, i + PAGES_PER_CALL));

  const collected: RawObservation[] = [];
  let done = 0;
  for (const batch of batches) {
    const previous = collected.at(-1);
    const content: ContentPart[] = [];
    for (const page of batch) {
      if (input.images[page.page]) content.push({ type: "image_url", image_url: { url: input.images[page.page] } });
    }
    const hint = repeated.size
      ? `Lignes répétées à chaque page (en-têtes/pieds probables) :\n${[...repeated].slice(0, 30).join("\n")}\n\n`
      : "";
    const context = previous
      ? `La page précédente se terminait dans une observation « ${previous.kind} » du ${previous.date ?? "?"}. Si ces pages commencent par sa suite, mets continues_previous à true pour la première observation.\n\n`
      : "Ces pages sont le début du document.\n\n";
    content.push({
      type: "text",
      text: `${hint}${context}Pages ${batch[0].page + 1} à ${batch.at(-1)!.page + 1}, lignes numérotées :\n${formatLines(batch.flatMap(pageLines))}`,
    });

    const result = await chatJson<{ observations: RawObservation[] }>({
      policy: input.policy,
      manifests: [input.manifest],
      messages: [
        { role: "system", content: SEGMENT_SYSTEM },
        { role: "user", content },
      ],
      schemaName: "segmentation",
      schema: SEGMENT_SCHEMA,
      fetchImpl: input.fetchImpl,
    });
    // Anchors come back 1-based for pages (as displayed); store 0-based.
    const obs = (result.observations ?? []).map((o) => ({
      ...o,
      start: { page: o.start.page - 1, line: o.start.line },
      end: { page: o.end.page - 1, line: o.end.line },
    }));
    for (const o of obs) {
      // A continuation (typically after a page break) extends its predecessor,
      // whether that one came from this call or the previous one.
      const before = collected.at(-1);
      if (o.continues_previous && before) {
        before.end = o.end;
        if (!before.date) before.date = o.date;
      } else {
        collected.push(o);
      }
    }
    input.onProgress?.(++done, batches.length);
  }

  return repairObservations(input.doc, input.pages, collected, repeated);
}

/** "YYYY-MM-DD", even with stray punctuation around it ("2022-12-07,"); else null. */
function isoDay(raw: string | null): string | null {
  const m = raw?.match(/^[\s\p{P}]*(\d{4}-\d{2}-\d{2})[\s\p{P}]*$/u);
  return m && isPartialDate(m[1]) ? m[1] : null;
}

const before = (a: { page: number; line: number }, b: { page: number; line: number }) =>
  a.page < b.page || (a.page === b.page && a.line < b.line);

/**
 * Make the model's answer structurally sound whatever it returned: anchors
 * inside the document, start <= end, sorted, no overlaps, valid dates.
 */
export function repairObservations(
  doc: string,
  pages: PageText[],
  raw: Pick<RawObservation, "start" | "end" | "date" | "kind" | "author_role" | "summary">[],
  repeated = repeatedLines(pages),
): Observation[] {
  const lineCount = new Map(pages.map((p) => [p.page, pageLines(p).length]));
  const clamp = (a: { page: number; line: number }) => {
    const page = Math.min(Math.max(a.page, pages[0]?.page ?? 0), pages.at(-1)?.page ?? 0);
    return { page, line: Math.min(Math.max(1, a.line), lineCount.get(page) ?? 1) };
  };
  const hasContent = (o: { start: { page: number; line: number }; end: { page: number; line: number } }) =>
    pages
      .filter((p) => p.page >= o.start.page && p.page <= o.end.page)
      .flatMap(pageLines)
      .some((l) => !before(l, o.start) && !before(o.end, l) && l.text.trim() && !isRepeated(l.text, repeated));

  const obs = raw
    .map((o) => ({ ...o, start: clamp(o.start), end: clamp(o.end) }))
    .filter((o) => !before(o.end, o.start))
    // Drop "observations" made only of header/footer lines before they can
    // truncate a real neighbour in the overlap pass below.
    .filter(hasContent)
    .sort((a, b) => (before(a.start, b.start) ? -1 : 1));

  for (let i = 0; i + 1 < obs.length; i++) {
    const next = obs[i + 1].start;
    if (!before(obs[i].end, next)) {
      // Overlap: end the earlier one on the line before the next start.
      obs[i].end =
        next.line > 1 ? { page: next.page, line: next.line - 1 } : { page: next.page - 1, line: lineCount.get(next.page - 1) ?? 1 };
    }
  }

  return obs
    .filter((o) => !before(o.end, o.start) && hasContent(o))
    .map((o, i) => ({
      id: `${doc}:o${i + 1}`,
      doc,
      start: o.start,
      end: o.end,
      date: isoDay(o.date),
      kind: o.kind.trim() || "observation",
      authorRole: o.author_role?.trim() || null,
      summary: o.summary.trim(),
    }));
}
