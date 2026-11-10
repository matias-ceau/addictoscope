import type { AnalysisState } from "./AnalysisCard";
import type { SourceDocState } from "./state";

export type StepStatus = "todo" | "active" | "done";
/** Where a step's data is: this browser, a remote model, or a recording. */
export type Place = "local" | "online" | "replay" | "off";

export interface JourneyStep {
  id: string;
  title: string;
  place: Place;
  status: StepStatus;
  /** One line on what happens to the data at this step. */
  detail: string;
}

/** Steps of the whole process, from the documents and the analysis state. */
export function journeySteps(docs: SourceDocState[], analysis: AnalysisState, online: Exclude<Place, "local">, showingFrise: boolean): JourneyStep[] {
  const any = docs.length > 0;
  const reading = docs.some((d) => d.status === "reading");
  const read = docs.some((d) => d.pages.length > 0 && d.status !== "reading");
  const reviewing = docs.some((d) => d.status === "review");
  const redacting = docs.some((d) => d.status === "redacting");
  const verified = docs.some((d) => d.status === "done" && d.manifest?.verified);
  const allVerified = any && docs.every((d) => d.status === "done" && d.manifest?.verified);
  const analysed = analysis.status === "done";

  const status = (done: boolean, active: boolean): StepStatus => (active ? "active" : done ? "done" : "todo");
  const onlineDetail =
    online === "replay"
      ? "Réponses enregistrées d'un vrai passage : rien n'est envoyé"
      : online === "off"
        ? "IA en ligne désactivée : rien ne peut partir"
        : "Seul le texte pseudonymisé part, sans conservation (ZDR) ; l'image des pages aussi quand la mise en page n'est pas reconnue";
  return [
    { id: "depot", title: "Dépôt", place: "local", status: status(any, !any), detail: "Les fichiers sont ouverts dans ce navigateur, sans envoi" },
    { id: "detection", title: "Détection", place: "local", status: status(read, reading), detail: "Règles et modèle d'IA local repèrent noms, dates, numéros" },
    { id: "relecture", title: "Relecture", place: "local", status: status(verified, reviewing && !verified), detail: "Vous validez ou corrigez chaque élément" },
    {
      id: "masquage",
      title: "Masquage et vérification",
      place: "local",
      status: status(verified, redacting || (verified && !allVerified && !analysed)),
      detail: "Le texte est réellement retiré du PDF, puis relu pour chercher les fuites",
    },
    {
      id: "analyse",
      title: "Analyse IA",
      place: online,
      status: status(analysed, analysis.status === "running" || (allVerified && !analysed)),
      detail: onlineDetail,
    },
    {
      id: "frise",
      title: "Frise ré-identifiée",
      place: "local",
      status: status(analysed && !showingFrise, analysed && showingFrise),
      detail: "Les vrais noms et les dates sont remis ici, sur ce poste",
    },
  ];
}

const PLACE_LABEL: Record<Place, string> = {
  local: "Ce poste",
  online: "En ligne · ZDR",
  replay: "Rejoué · aucun envoi",
  off: "Désactivée",
};

function PlaceIcon({ place }: { place: Place }) {
  if (place === "local")
    return (
      <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden>
        <rect x="3" y="4" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden>
      <path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 9.5 4.3 4.3 0 0 0 7 18z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

export function Journey({ steps }: { steps: JourneyStep[] }) {
  return (
    <nav className="journey" aria-label="Parcours des données">
      <ol>
        {steps.map((s, i) => (
          <li key={s.id} className={`journey-step ${s.status} place-${s.place}`} title={s.detail} aria-current={s.status === "active" ? "step" : undefined}>
            <span className="journey-dot" aria-hidden>
              {s.status === "done" ? "✓" : i + 1}
            </span>
            <span className="journey-text">
              <span className="journey-title">{s.title}</span>
              <span className="journey-place">
                <PlaceIcon place={s.place} /> {PLACE_LABEL[s.place]}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="journey-detail">
        {(steps.find((s) => s.status === "active") ?? steps.at(-1))!.detail}
      </p>
    </nav>
  );
}
