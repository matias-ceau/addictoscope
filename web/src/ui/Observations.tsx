import { useMemo, useState } from "react";

import { reidentify, type KeyTable } from "../core/reidentify";
import type { Observation } from "../notebook/model";
import { groupObservations } from "../notebook/observations";

const formatDate = (s: string | null) => {
  if (!s) return "sans date";
  const [y, m, d] = s.split("-");
  return d ? `${d}/${m}/${y}` : m ? `${m}/${y}` : y;
};

/**
 * The observations cut out of each document by the analysis, in
 * chronological order: what the frise was built from. A click opens the
 * observation in its page, highlighted.
 */
export function Observations(props: {
  observations: Observation[];
  /** App document id -> file name, in the order of the sources. */
  docNames: Record<string, string>;
  keyTable?: KeyTable;
  onOpenSource?: (observationId: string, real: boolean) => void;
}) {
  const hasKey = (props.keyTable?.size ?? 0) > 0;
  const [names, setNames] = useState<"real" | "pseudo">(hasKey ? "real" : "pseudo");
  const real = hasKey && names === "real";
  const groups = useMemo(() => groupObservations(props.observations, Object.keys(props.docNames)), [props.observations, props.docNames]);
  const show = (s: string) => (real ? reidentify(s, props.keyTable!) : s);
  const dated = props.observations.filter((o) => o.date).length;

  return (
    <section className="panel observations" aria-label="Observations">
      <div className="panel-head">
        <div>
          <h2>Observations</h2>
          <p className="muted small">
            {props.observations.length} observations découpées dans {groups.length} document{groups.length > 1 ? "s" : ""}, dont {dated} datées.
            Chaque événement de la frise cite une ou plusieurs de ces observations.
          </p>
        </div>
        {hasKey && (
          <div className="segmented small" role="tablist" aria-label="Noms affichés">
            <button role="tab" aria-selected={names === "real"} onClick={() => setNames("real")}>
              Noms réels
            </button>
            <button role="tab" aria-selected={names === "pseudo"} onClick={() => setNames("pseudo")}>
              Pseudonymes
            </button>
          </div>
        )}
      </div>
      <div className="panel-body scroll">
        {groups.map((g) => (
          <div key={g.doc} className="obs-group">
            <h3>{props.docNames[g.doc] ?? g.doc}</h3>
            <ol>
              {g.observations.map((o) => (
                <li key={o.id}>
                  <button className="obs-item" onClick={() => props.onOpenSource?.(o.id, real)} title="Ouvrir l'observation dans sa page">
                    <span className="obs-date">{formatDate(o.date)}</span>
                    <span className="obs-body">
                      <span className="obs-kind">
                        {show(o.kind)}
                        {o.authorRole ? ` · ${show(o.authorRole)}` : ""}
                      </span>
                      <span className="obs-summary">{show(o.summary)}</span>
                    </span>
                    <span className="obs-where">
                      p. {o.start.page + 1}, l. {o.start.line}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
