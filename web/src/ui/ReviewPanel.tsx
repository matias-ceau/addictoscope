import { useMemo, useState, type Dispatch } from "react";

import { encryptKeyfile, type KeyEntry } from "../core/keyfile";
import type { Category, Detection } from "../core/types";
import { CATEGORY_INFO, CATEGORY_ORDER } from "./categories";
import type { Action, SourceDocState } from "./state";

interface Group {
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
}) {
  const { doc, dispatch } = props;
  const mine = props.detections.filter((d) => d.doc === doc.id);
  const [cursor, setCursor] = useState<Record<string, number>>({});
  const [keyDialog, setKeyDialog] = useState(false);

  const groups = useMemo(() => {
    const byEntity = new Map<string, Group>();
    for (const d of mine) {
      const key = `${d.entity}|${d.label}`;
      if (!byEntity.has(key)) byEntity.set(key, { entity: key, label: d.label, category: d.category, texts: [], items: [] });
      const g = byEntity.get(key)!;
      g.items.push(d);
      if (d.text && !g.texts.includes(d.text)) g.texts.push(d.text);
    }
    return [...byEntity.values()].sort(
      (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || a.label.localeCompare(b.label),
    );
  }, [mine]);

  const accepted = mine.filter((d) => d.accepted).length;
  const editable = doc.status === "review";

  const focusNext = (g: Group) => {
    const i = ((cursor[g.entity] ?? -1) + 1) % g.items.length;
    setCursor({ ...cursor, [g.entity]: i });
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
                <div key={g.entity} className={"entity" + (on === 0 ? " off" : "")} style={{ "--hue": info.hue } as React.CSSProperties}>
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
                    <span className="entity-text">{g.texts.slice(0, 3).join(" · ") || "zone tracée"}</span>
                  </button>
                  <span className="count" title="Occurrences">
                    {g.items.length}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="panel-foot">
            <p className="small muted">
              Vérifiez chaque surlignage : un élément oublié restera lisible dans le document final.
            </p>
            <button className="primary" disabled={doc.status === "redacting"} onClick={props.onPseudonymise}>
              {doc.status === "redacting" ? "Masquage et contrôle…" : "Pseudonymiser ce document"}
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

          <div className={"card next-step" + (doc.manifest.verified ? "" : " locked")}>
            <span className="eyebrow">Étape suivante</span>
            <strong>Analyse par IA</strong>
            <p className="muted small">
              Frise chronologique et questions sur le dossier, avec renvoi à la page source. Seuls les documents vérifiés
              peuvent être envoyés à un modèle, via un fournisseur sans conservation des données.
            </p>
            <span className="chip">Bientôt</span>
          </div>
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
