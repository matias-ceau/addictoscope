import { useMemo, useState, type Dispatch } from "react";

import { encryptKeyfile, type KeyEntry } from "../core/keyfile";
import type { Category, Detection } from "../core/types";
import { CATEGORY_INFO, CATEGORY_ORDER } from "./categories";
import type { Action, SourceDocState } from "./state";

interface Group {
  /** Row key: entity and label. */
  key: string;
  entity: string;
  label: string;
  category: Category;
  texts: string[];
  items: Detection[];
}

function download(data: Uint8Array, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ReviewPanel(props: {
  doc: SourceDocState;
  detections: Detection[];
  dispatch: Dispatch<Action>;
  onPseudonymise: () => void;
  /** The analysis card, shown once the document is pseudonymized. */
  nextStep?: React.ReactNode;
}) {
  const { doc, dispatch } = props;
  const mine = props.detections.filter((d) => d.doc === doc.id);
  const [cursor, setCursor] = useState<Record<string, number>>({});
  const [keyDialog, setKeyDialog] = useState(false);

  const groups = useMemo(() => {
    const byEntity = new Map<string, Group>();
    for (const d of mine) {
      const key = `${d.entity}|${d.label}`;
      if (!byEntity.has(key)) byEntity.set(key, { key, entity: d.entity, label: d.label, category: d.category, texts: [], items: [] });
      const g = byEntity.get(key)!;
      g.items.push(d);
      if (d.text && !g.texts.includes(d.text)) g.texts.push(d.text);
    }
    return [...byEntity.values()].sort(
      (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || a.label.localeCompare(b.label),
    );
  }, [mine]);

  // Merge targets: every entity of the corpus, so one person keeps one pseudonym across documents.
  const entities = useMemo(() => {
    const out = new Map<string, { label: string; category: Category; texts: string[] }>();
    for (const d of props.detections) {
      if (!out.has(d.entity)) out.set(d.entity, { label: d.label, category: d.category, texts: [] });
      const e = out.get(d.entity)!;
      if (d.text && e.texts.length < 3 && !e.texts.includes(d.text)) e.texts.push(d.text);
    }
    return [...out.entries()].sort(
      ([, a], [, b]) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || a.label.localeCompare(b.label),
    );
  }, [props.detections]);
  const [editing, setEditing] = useState<string | null>(null);

  const accepted = mine.filter((d) => d.accepted).length;
  const editable = doc.status === "review";

  const focusNext = (g: Group) => {
    const i = ((cursor[g.key] ?? -1) + 1) % g.items.length;
    setCursor({ ...cursor, [g.key]: i });
    dispatch({ type: "focus", id: g.items[i].id });
  };

  return (
    <aside className="panel review">
      {doc.status === "reading" && (
        <div className="panel-body center muted">
          <div className="spinner" />
          <p>Recherche des éléments identifiants…</p>
        </div>
      )}

      {doc.status === "error" && (
        <div className="panel-body">
          <div className="card card-warn">
            <strong>Ce fichier n'a pas pu être lu.</strong>
            <p className="muted">{doc.error}</p>
          </div>
        </div>
      )}

      {(doc.status === "review" || doc.status === "redacting") && (
        <>
          <div className="panel-head">
            <h2>Éléments identifiants</h2>
            <span className="muted">
              {accepted}/{mine.length}
            </span>
          </div>
          <div className="panel-body scroll">
            {groups.length === 0 && <p className="muted">Aucun élément détecté. Tracez un cadre sur la page pour masquer une zone.</p>}
            {groups.map((g) => {
              const on = g.items.filter((d) => d.accepted).length;
              const info = CATEGORY_INFO[g.category];
              return (
                <div key={g.key} className="entity-wrap">
                  <div className={"entity" + (on === 0 ? " off" : "")} style={{ "--hue": info.hue } as React.CSSProperties}>
                    <input
                      type="checkbox"
                      aria-label={`Masquer ${g.label}`}
                      checked={on > 0}
                      ref={(el) => {
                        if (el) el.indeterminate = on > 0 && on < g.items.length;
                      }}
                      disabled={!editable}
                      onChange={(e) => dispatch({ type: "toggle", ids: g.items.map((d) => d.id), accepted: e.target.checked })}
                    />
                    <button className="entity-body" onClick={() => focusNext(g)} title="Voir dans le document">
                      <span className="entity-top">
                        <span className="tag">{g.label}</span>
                        <span className="muted small">{info.name}</span>
                      </span>
                      <span className="entity-text">
                        {g.items.some((d) => d.source === "ner") && <span className="ai-badge" title="Proposé par l'IA locale">IA</span>}
                        {g.texts.slice(0, 3).join(" · ") || "zone tracée"}
                      </span>
                    </button>
                    <span className="count" title="Occurrences">
                      {g.items.length}
                    </span>
                    {editable && (
                      <button
                        className="ghost entity-more"
                        aria-expanded={editing === g.key}
                        title="Corriger la catégorie ou regrouper"
                        onClick={() => setEditing(editing === g.key ? null : g.key)}
                      >
                        ⋯
                      </button>
                    )}
                  </div>
                  {editing === g.key && (
                    <div className="entity-edit">
                      <label>
                        Catégorie
                        <select
                          value={g.category}
                          onChange={(e) => {
                            dispatch({ type: "recategorise", entity: g.entity, category: e.target.value as Category });
                            setEditing(null);
                          }}
                        >
                          {CATEGORY_ORDER.map((c) => (
                            <option key={c} value={c}>
                              {CATEGORY_INFO[c].name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Même entité que
                        <select
                          value=""
                          onChange={(e) => {
                            dispatch({ type: "merge", entity: g.entity, into: e.target.value });
                            setEditing(null);
                          }}
                        >
                          <option value="">—</option>
                          {entities
                            .filter(([id]) => id !== g.entity)
                            .map(([id, e]) => (
                              <option key={id} value={id}>
                                {e.label} · {e.texts.join(" · ") || "zone tracée"}
                              </option>
                            ))}
                        </select>
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="panel-foot">
            {doc.ner?.status === "running" && (
              <div className="ai-progress" role="status">
                <span>
                  <span className="ai-dot" aria-hidden /> Relecture par l'IA locale… {doc.ner.done}/{doc.ner.total} p.
                </span>
                <progress max={doc.ner.total} value={doc.ner.done} />
              </div>
            )}
            {doc.ner?.status === "done" && (
              <p className="small ai-done">✓ Relu aussi par l'IA locale (modèle de reconnaissance des noms, sur ce poste)</p>
            )}
            {doc.ner?.status === "unavailable" && (
              <p className="small muted">IA locale indisponible : détection par règles uniquement.</p>
            )}
            <p className="small muted">
              Vérifiez chaque surlignage : un élément oublié restera lisible dans le document final.
            </p>
            <button
              className="primary"
              disabled={doc.status === "redacting" || doc.ner?.status === "running"}
              onClick={props.onPseudonymise}
            >
              {doc.status === "redacting"
                ? "Masquage et contrôle…"
                : doc.ner?.status === "running"
                  ? "Patientez, relecture IA en cours…"
                  : "Pseudonymiser ce document"}
            </button>
          </div>
        </>
      )}

      {doc.status === "done" && doc.manifest && doc.output && (
        <div className="panel-body scroll">
          {doc.manifest.verified ? (
            <div className="card card-ok">
              <strong>Document pseudonymisé et vérifié</strong>
              <ul className="checks">
                <li>{Object.values(doc.manifest.redactions).reduce((a, b) => a + b, 0)} éléments supprimés du fichier</li>
                <li>Texte du résultat relu : aucun identifiant retrouvé</li>
                {doc.manifest.ocrPages.length > 0 && <li>Pages scannées relues par OCR : {doc.manifest.ocrPages.length}</li>}
                <li>Métadonnées et pièces jointes retirées</li>
              </ul>
            </div>
          ) : (
            <div className="card card-warn">
              <strong>Des identifiants restent lisibles</strong>
              <ul className="checks">
                {doc.manifest.leaks.slice(0, 8).map((l, i) => (
                  <li key={i}>
                    p. {l.page + 1} : « {l.text} »
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="actions">
            <button className="primary" onClick={() => download(doc.output!, doc.pseudoName, "application/pdf")}>
              Télécharger le PDF pseudonymisé
            </button>
            <button onClick={() => setKeyDialog(true)}>Exporter la table de correspondance…</button>
            <button
              className="ghost"
              onClick={() => dispatch({ type: "patch", id: doc.id, patch: { status: "review", output: undefined, manifest: undefined } })}
            >
              Revenir à la vérification
            </button>
          </div>

          {props.nextStep}
        </div>
      )}

      {keyDialog && <KeyDialog detections={props.detections} onClose={() => setKeyDialog(false)} />}
    </aside>
  );
}

function KeyDialog({ detections, onClose }: { detections: Detection[]; onClose: () => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const ok = pw.length >= 10 && pw === pw2;

  const save = async () => {
    setBusy(true);
    const byLabel = new Map<string, KeyEntry>();
    for (const d of detections.filter((x) => x.accepted && x.text)) {
      if (!byLabel.has(d.label)) byLabel.set(d.label, { label: d.label, category: d.category, values: [] });
      const e = byLabel.get(d.label)!;
      if (!e.values.includes(d.text)) e.values.push(d.text);
    }
    const data = await encryptKeyfile([...byLabel.values()], pw);
    download(data, "table-de-correspondance.axkey", "application/octet-stream");
    setBusy(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
        <h3>Table de correspondance chiffrée</h3>
        <p className="muted small">
          Ce fichier permet de retrouver qui se cache derrière chaque pseudonyme. Il est chiffré avec votre mot de passe
          et doit rester sur un support sécurisé de l'établissement, séparé des documents pseudonymisés.
        </p>
        <label>
          Mot de passe (10 caractères minimum)
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        </label>
        <label>
          Confirmer
          <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </label>
        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>
            Annuler
          </button>
          <button className="primary" disabled={!ok || busy} onClick={save}>
            Chiffrer et télécharger
          </button>
        </div>
      </div>
    </div>
  );
}
