import { useEffect, useState } from "react";

import { loadDemoIndex, type DemoDossier } from "../app/demo";
import { modelName } from "../cloud/models";
import { FilePicker, PasteButton, UploadIcon } from "./DropOverlay";

const LOCAL_STEPS = [
  { title: "Dépôt", text: "PDF, Word, texte ou texte collé, ouverts dans le navigateur" },
  { title: "Détection", text: "Règles et IA locale repèrent noms, dates, numéros, adresses" },
  { title: "Relecture", text: "Vous validez chaque élément sur la page" },
  { title: "Masquage", text: "Le texte est retiré du PDF, puis relu pour chercher les fuites" },
];

export function Welcome(props: {
  onFiles: (files: File[]) => void;
  onDemo: (d: DemoDossier) => void;
  onReopen: (files: File[]) => void;
  reopenError: string | null;
}) {
  const { onFiles, onDemo } = props;
  const [demos, setDemos] = useState<DemoDossier[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  useEffect(() => {
    loadDemoIndex().then(setDemos, () => setDemos([]));
  }, []);

  return (
    <main className="welcome">
      <section className="hero">
        <span className="eyebrow">Addictologie · dossier patient</span>
        <h1>Du dossier patient à la frise chronologique, sans exposer le patient.</h1>
        <p className="hero-sub">
          Pseudonymisation sur ce poste, relecture par le clinicien, analyse par IA du seul texte pseudonymisé, puis
          frise des consommations, de la psychopathologie, des traitements et des événements de vie, avec les vrais noms
          remis localement.
        </p>
      </section>

      <section className="flow" aria-label="Où vont les données">
        <div className="flow-zone local">
          <span className="flow-zone-title">
            <ShieldIcon /> Sur ce poste
          </span>
          <ol>
            {LOCAL_STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="flow-num">{i + 1}</span>
                <strong>{s.title}</strong>
                <span>{s.text}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flow-gate" aria-hidden>
          <span>texte pseudonymisé et vérifié uniquement</span>
        </div>
        <div className="flow-zone online">
          <span className="flow-zone-title">
            <CloudIcon /> En ligne, sans conservation
          </span>
          <ol start={5}>
            <li>
              <span className="flow-num">5</span>
              <strong>Analyse IA</strong>
              <span>Découpage en observations, puis frise. Aucune donnée conservée ni réutilisée (ZDR)</span>
            </li>
          </ol>
        </div>
        <div className="flow-gate back" aria-hidden>
          <span>étiquettes et âges</span>
        </div>
        <div className="flow-zone local">
          <span className="flow-zone-title">
            <ShieldIcon /> Sur ce poste
          </span>
          <ol start={6}>
            <li>
              <span className="flow-num">6</span>
              <strong>Frise</strong>
              <span>Vrais noms et dates remis ici, à partir de la table locale</span>
            </li>
          </ol>
        </div>
      </section>

      <div className="welcome-grid">
        <section className="welcome-col">
          <h2>Vos documents</h2>
          <FilePicker onFiles={onFiles} className="welcome-drop">
            <span className="welcome-icon">
              <UploadIcon size={30} />
            </span>
            <strong>Glissez vos documents patient ici</strong>
            <span className="muted">ou cliquez pour choisir des fichiers (PDF, Word, texte)</span>
          </FilePicker>
          <div className="welcome-actions">
            <PasteButton onFiles={onFiles} className="welcome-paste" />
            <label className="welcome-paste" title="Analyse enregistrée (.json), avec sa table de correspondance (.axkey) pour les vrais noms">
              Rouvrir une analyse…
              <input
                type="file"
                accept=".json,.axkey"
                multiple
                hidden
                onChange={(e) => e.target.files && props.onReopen([...e.target.files])}
              />
            </label>
          </div>
          {props.reopenError && <p className="small error-text">{props.reopenError}</p>}
        </section>

        {demos.length > 0 && (
          <section className="welcome-col">
            <h2>
              Démonstration <span className="fictive">données fictives</span>
            </h2>
            <p className="muted small demo-intro">
              Dossiers entièrement inventés. Tout le processus s'exécute pour de vrai ; l'analyse IA rejoue les réponses
              enregistrées d'un vrai passage du modèle : aucune clé, aucun envoi.
            </p>
            <ul className="demo-list">
              {demos.map((d) => (
                <li key={d.slug}>
                  <button
                    className="demo-card"
                    disabled={loading !== null}
                    onClick={() => {
                      setLoading(d.slug);
                      onDemo(d);
                    }}
                  >
                    <span className="demo-title">{d.title}</span>
                    <span className="demo-summary">{d.summary}</span>
                    <span className="demo-meta">
                      {d.docs.map((doc) => `${doc.title} (${doc.pages} p.)`).join(" · ")}
                    </span>
                    <span className="demo-meta">
                      Réponses enregistrées : {d.recordings.map((r) => modelName(r.model)).join(", ")}
                    </span>
                    <span className="demo-go">{loading === d.slug ? "Ouverture…" : "Ouvrir ce dossier →"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

export function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
      <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloudIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
      <path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 9.5 4.3 4.3 0 0 0 7 18z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
