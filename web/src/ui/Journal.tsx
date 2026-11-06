import { useMemo, useState, useSyncExternalStore } from "react";

import { ledgerEntries, realValuesIn, subscribeLedger, type OutboundEntry } from "../cloud/ledger";
import { modelName } from "../cloud/models";

export function useLedger(): OutboundEntry[] {
  return useSyncExternalStore(subscribeLedger, ledgerEntries);
}

const time = (t: number) => new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const size = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} Mo` : `${Math.max(1, Math.round(b / 1e3))} ko`);
const SCHEMA_LABEL: Record<string, string> = { segmentation: "Découpage en observations", frise: "Construction de la frise", arbitrage: "Arbitrage des désaccords" };

/** Top-bar pill: where the data is right now, from the journal. */
export function DataStatus({ demo, onOpen }: { demo: boolean; onOpen: () => void }) {
  const entries = useLedger();
  const pending = entries.find((e) => e.status === "pending");
  const sent = entries.filter((e) => !e.replayed && e.status !== "refused");
  const replayed = entries.filter((e) => e.replayed);

  let cls = "local";
  let text = "Tout reste sur ce poste";
  if (pending && !pending.replayed) {
    cls = "sending";
    text = `Envoi en cours → ${pending.destination} (texte pseudonymisé)`;
  } else if (pending) {
    cls = "replay";
    text = "Rejeu en cours · aucun envoi";
  } else if (sent.length) {
    cls = "sent";
    text = `${sent.length} envoi${sent.length > 1 ? "s" : ""} pseudonymisé${sent.length > 1 ? "s" : ""} → ${sent[0].destination}`;
  } else if (replayed.length || demo) {
    cls = "replay";
    text = replayed.length ? `Aucun envoi · ${replayed.length} réponses rejouées` : "Démonstration · aucun envoi";
  }
  return (
    <button className={`data-status ${cls}`} onClick={onOpen} title="Journal des envois : tout ce qui a quitté (ou aurait quitté) ce navigateur">
      <span className="data-status-dot" aria-hidden />
      {text}
      <span className="data-status-more">Journal</span>
    </button>
  );
}

function EntryCard({ e, realValues, docNames }: { e: OutboundEntry; realValues: string[]; docNames: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const found = useMemo(() => realValuesIn(e.text, realValues), [e.text, realValues]);
  const where = e.status === "refused" ? "Refusé par la garde" : e.replayed ? "Rejoué (aucun envoi)" : e.destination;
  return (
    <li className={`journal-entry ${e.status}${e.replayed ? " replayed" : ""}`}>
      <div className="journal-head">
        <span className="journal-time">{time(e.startedAt)}</span>
        <strong>{SCHEMA_LABEL[e.schema] ?? e.schema}</strong>
        <span className={`journal-where ${e.replayed ? "replay" : e.status === "refused" ? "refused" : "online"}`}>{where}</span>
      </div>
      <div className="journal-meta">
        <span>{modelName(e.model)}</span>
        {e.zdr && <span className="pill-zdr">ZDR</span>}
        <span>{e.docs.map((d) => docNames[d] ?? d).join(", ")}</span>
        {e.bytes > 0 && <span>{size(e.bytes)}</span>}
        <span>{e.images.length} image{e.images.length > 1 ? "s" : ""}</span>
        {e.endedAt && e.status !== "refused" && <span>{((e.endedAt - e.startedAt) / 1000).toFixed(1)} s</span>}
        {e.cost !== undefined && <span>{e.cost.toFixed(4)} $</span>}
        {e.status === "pending" && <span className="ai-dot" aria-label="en cours" />}
      </div>
      {e.error && <p className="small error-text">{e.error}</p>}
      {e.status !== "refused" && (
        <p className={`journal-check ${found.length ? "bad" : "good"}`}>
          {found.length
            ? `${found.length} valeur(s) réelle(s) retrouvée(s) dans le texte : ${found.join(", ")}`
            : `0 valeur réelle dans le texte envoyé (contrôle local sur ${realValues.length} valeurs relues)`}
        </p>
      )}
      <button className="link small" onClick={() => setOpen(!open)}>
        {open ? "Masquer le contenu" : "Voir exactement ce qui est envoyé"}
      </button>
      {open && (
        <div className="journal-payload">
          {e.images.length > 0 && (
            <div className="journal-images">
              {e.images.map((src, i) => (
                <img key={i} src={src} alt={`Page envoyée ${i + 1}`} />
              ))}
            </div>
          )}
          <pre>{e.text}</pre>
        </div>
      )}
    </li>
  );
}

/** Side drawer: every request to a remote model, sent, replayed or refused. */
export function Journal(props: { onClose: () => void; realValues: string[]; docNames: Record<string, string> }) {
  const entries = useLedger();
  const sent = entries.filter((e) => !e.replayed && e.status !== "refused");
  const bytes = sent.reduce((n, e) => n + e.bytes, 0);
  return (
    <div className="drawer-backdrop" onClick={props.onClose}>
      <aside className="drawer" role="dialog" aria-modal aria-labelledby="journal-title" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <span className="eyebrow">Transparence</span>
            <h3 id="journal-title">Journal des envois</h3>
          </div>
          <button className="icon-btn" onClick={props.onClose} aria-label="Fermer">
            ×
          </button>
        </header>
        <div className="journal-summary">
          <div>
            <strong>{sent.length}</strong>
            <span>requête{sent.length > 1 ? "s" : ""} envoyée{sent.length > 1 ? "s" : ""}</span>
          </div>
          <div>
            <strong>{bytes ? size(bytes) : "0"}</strong>
            <span>sortis de ce poste</span>
          </div>
          <div>
            <strong>{entries.filter((e) => e.replayed).length}</strong>
            <span>réponses rejouées</span>
          </div>
        </div>
        <ul className="never-sent">
          <li>Jamais envoyés : les documents d'origine, la table de correspondance (étiquette → vrai nom), la date de naissance complète.</li>
          <li>Envoyés seulement après masquage et vérification : texte et images des pages pseudonymisées (l'année de naissance y reste, en clair).</li>
          <li>Le journal reste en mémoire dans ce navigateur : il n'est ni enregistré ni transmis.</li>
        </ul>
        {entries.length === 0 ? (
          <p className="muted center-text">Aucune requête pour l'instant : tout est resté sur ce poste.</p>
        ) : (
          <ol className="journal-list">
            {[...entries].reverse().map((e) => (
              <EntryCard key={e.id} e={e} realValues={props.realValues} docNames={props.docNames} />
            ))}
          </ol>
        )}
      </aside>
    </div>
  );
}
