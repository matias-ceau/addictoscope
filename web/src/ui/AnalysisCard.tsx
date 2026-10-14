import type { AnalysisProgress } from "../app/analysis";
import type { CloudPolicy } from "../cloud/guard";
import type { Observation, Timeline } from "../notebook/model";

export interface AnalysisState {
  status: "idle" | "running" | "done" | "error";
  progress?: AnalysisProgress;
  observations?: Observation[];
  timeline?: Timeline;
  error?: string;
  /** Documents included in the last run. */
  docs?: string[];
}

function progressLabel(p?: AnalysisProgress): string {
  if (!p) return "Préparation…";
  if (p.step === "images") return `Préparation des pages ${p.done}/${p.total}`;
  if (p.step === "segment") return `Découpage des observations ${p.done}/${p.total}`;
  return `Construction de la frise ${p.done}/${p.total}`;
}

export function AnalysisCard(props: {
  verifiedCount: number;
  policy: CloudPolicy;
  ready: boolean;
  analysis: AnalysisState;
  onConfigure: () => void;
  onRun: () => void;
  onShowFrise: () => void;
}) {
  const { analysis } = props;
  const locked = props.verifiedCount === 0;
  return (
    <div className={"card next-step" + (locked ? " locked" : "")}>
      <span className="eyebrow">Étape suivante</span>
      <strong>Analyse par IA</strong>
      <p className="muted small">
        Découpage du dossier en observations, puis frise chronologique (consommations, psychopathologie, traitements,
        événements de vie) avec renvoi à la page source. Porte sur les {props.verifiedCount} document(s) vérifié(s).
      </p>

      {!props.ready && (
        <button onClick={props.onConfigure} disabled={locked}>
          Configurer l'IA en ligne…
        </button>
      )}

      {props.ready && analysis.status !== "running" && (
        <>
          <p className="small muted">
            Modèle : {props.policy.kind !== "off" && props.policy.model}
            {props.policy.kind === "openrouter-zdr" && " · OpenRouter, zéro conservation"}{" "}
            <button className="link" onClick={props.onConfigure}>
              modifier
            </button>
          </p>
          <button className="primary" disabled={locked} onClick={props.onRun}>
            {analysis.status === "done" ? "Relancer l'analyse" : "Analyser le dossier"}
          </button>
        </>
      )}

      {analysis.status === "running" && (
        <div className="ai-progress" role="status">
          <span>
            <span className="ai-dot" aria-hidden /> {progressLabel(analysis.progress)}
          </span>
          {analysis.progress && <progress max={analysis.progress.total} value={analysis.progress.done} />}
        </div>
      )}

      {analysis.status === "error" && <p className="small error-text">{analysis.error}</p>}

      {analysis.status === "done" && analysis.timeline && (
        <div className="analysis-done">
          <span className="small">
            {analysis.observations?.length} observations · {analysis.timeline.events.length} événements
          </span>
          <button onClick={props.onShowFrise}>Voir la frise</button>
        </div>
      )}
    </div>
  );
}
