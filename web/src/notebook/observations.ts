import type { Observation } from "./model";

export interface ObservationGroup {
  doc: string;
  observations: Observation[];
}

const position = (o: Observation) => o.start.page * 100_000 + o.start.line;

/**
 * Observations by document (in `docOrder`, then any other document), each
 * group in chronological order: dated first by date, then undated ones,
 * ties by their place in the document.
 */
export function groupObservations(observations: Observation[], docOrder: string[] = []): ObservationGroup[] {
  const byDoc = new Map<string, Observation[]>();
  for (const o of observations) byDoc.set(o.doc, [...(byDoc.get(o.doc) ?? []), o]);
  const order = [...docOrder.filter((d) => byDoc.has(d)), ...[...byDoc.keys()].filter((d) => !docOrder.includes(d))];
  return order.map((doc) => ({
    doc,
    observations: [...byDoc.get(doc)!].sort((a, b) => {
      if (a.date && b.date && a.date !== b.date) return a.date < b.date ? -1 : 1;
      if (!a.date !== !b.date) return a.date ? -1 : 1;
      return position(a) - position(b);
    }),
  }));
}
