import type { AnalysisProgress } from "../app/analysis";
import type { DemoDossier } from "../app/demo";
import type { CloudPolicy } from "../cloud/guard";
import { modelName } from "../cloud/models";
import type { Observation, Timeline } from "../notebook/model";

/** What the second pass did, or what it is for. */
export function proofreadingNote(analysis: Pick<AnalysisState, "timeline" | "proofreadingNow">): string {
  const p = analysis.timeline?.proofreading;
  if (analysis.proofreadingNow) return "Relecture de la frise contre le texte…";
  if (!p) return "Relecture : dates, fins et « en cours » vérifiés contre tout le texte.";
  if (p.failed) return `Relecture non faite (${p.failed}) : la frise est restée telle quelle.`;
  return `Relue contre le texte : ${p.fixed} corrigé${p.fixed > 1 ? "s" : ""}, ${p.removed} retiré${p.removed > 1 ? "s" : ""}, ${p.added} ajouté${p.added > 1 ? "s" : ""} sur ${p.checked}.`;
}

export interface AnalysisState {
  status: "idle" | "running" | "done" | "error";
  progress?: AnalysisProgress;
  observations?: Observation[];
  timeline?: Timeline;
  error?: string;
  /** Documents included in the last run. */
  docs?: string[];
  /** Model of the last run, and whether its answers were replayed. */
  model?: string;
  replayed?: boolean;
  /** Per document of the last run: observations found here by rules, or by the model. */
  segmentedBy?: Record<string, "rules" | "model">;
  /** While running: the frise of the previous reading, whose corrections by hand are put back. */
  corrected?: Timeline;
  /** The frise is being read again against its text. */
  proofreadingNow?: boolean;
}

/** In the demonstration: which recording to replay, or "live". */
export interface DemoAnalysis {
  dossier: DemoDossier;
  /** Every document of the dossier is pseudonymized and verified. */
  allVerified: boolean;
  source: string;
  onSource: (source: string) => void;
}

const dollars = (n: number) => (n < 0.01 ? `${n.toFixed(3)} $` : `${n.toFixed(2)} $`);

/** Where the observations were split: said plainly, it decides whether page images left this machine. */
function segmentationNote(by?: Record<string, "rules" | "model">): string | null {
  const how = Object.values(by ?? {});
  if (!how.length) return null;
  const local = how.filter((h) => h === "rules").length;
  if (local === how.length) return "Découpage en observations fait sur ce poste (mise en page reconnue) : aucune image de page envoyée.";
  if (local === 0) return "Découpage en observations par le modèle, à partir du texte et des images des pages pseudonymisées.";
  return `Découpage en observations fait sur ce poste pour ${local} document(s) sur ${how.length} ; pour les autres, par le modèle (texte et images des pages pseudonymisées).`;
}

function progressLabel(p?: AnalysisProgress): string {
  if (!p) return "Préparation…";
  if (p.step === "images") return `Préparation des pages ${p.done}/${p.total}`;
  if (p.step === "segment") return `Découpage des observations ${p.done}/${p.total}`;
  if (p.step === "consolidate") return "Regroupement des doublons…";
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
  /** Read the frise again against the whole text (one more call); absent when nothing can be sent. */
  onProofread?: () => void;
  demo?: DemoAnalysis;
}) {
  const { analysis, demo } = props;
  const locked = demo ? !demo.allVerified : props.verifiedCount === 0;
  const replaying = demo !== undefined && demo.source !== "live";
  return (
    <div className={"card next-step" + (locked ? " locked" : "")}>
      <span className="eyebrow">Étape 5 · en ligne</span>
      <strong>Analyse par IA</strong>
      <p className="muted small">
        Découpage du dossier en observations, puis frise chronologique (consommations, psychopathologie, traitements,
        événements de vie) avec renvoi à la page source. Porte sur les {props.verifiedCount} document(s) vérifié(s).
      </p>

      {demo && analysis.status !== "running" && (
        <div className="choices compact" role="radiogroup" aria-label="Source des réponses">
          {demo.dossier.recordings.map((r) => (
            <label key={r.file} className={"choice" + (demo.source === r.file ? " selected" : "")}>
              <input type="radio" name="demo-source" checked={demo.source === r.file} onChange={() => demo.onSource(r.file)} />
              <span>
                <strong>{modelName(r.model)}</strong>
                <span className="recording-stats">
                  {r.score && (
                    <span title="Événements de la frise attendue (vérité du dossier fictif) retrouvés par ce passage">
                      {Math.round((100 * r.score.found) / r.score.expected)} % des événements attendus
                    </span>
                  )}
                  <span title={r.costEstimated ? "Passage sans appel payant : coût estimé d'après les caractères échangés" : undefined}>
                    {r.costEstimated ? "≈ " : ""}
                    {dollars(r.cost)}
                  </span>
                  {r.elapsedMs ? <span>{Math.round(r.elapsedMs / 1000)} s</span> : null}
                </span>
                <span className="muted small">Réponses enregistrées d'un vrai passage · aucun envoi</span>
              </span>
            </label>
          ))}
          {props.ready && (
            <label className={"choice" + (demo.source === "live" ? " selected" : "")}>
              <input type="radio" name="demo-source" checked={demo.source === "live"} onChange={() => demo.onSource("live")} />
              <span>
                <strong>En direct</strong>
                <span className="muted small">
                  {props.policy.kind !== "off" && modelName(props.policy.model)} · envoi réel du texte pseudonymisé
                </span>
              </span>
            </label>
          )}
        </div>
      )}
      {demo && !demo.allVerified && (
        <p className="small muted">Pseudonymisez d'abord les {demo.dossier.docs.length} document(s) du dossier.</p>
      )}
      {replaying && analysis.status !== "running" && (
        <button className="primary" disabled={locked} onClick={props.onRun}>
          {analysis.status === "done" ? "Relancer l'analyse (rejouée)" : "Analyser le dossier (rejoué)"}
        </button>
      )}

      {!replaying && !props.ready && (
        <button onClick={props.onConfigure} disabled={locked}>
          Configurer l'IA en ligne…
        </button>
      )}

      {!replaying && props.ready && analysis.status !== "running" && (
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
            {analysis.model && ` · ${modelName(analysis.model)}${analysis.replayed ? " (rejoué)" : ""}`}
          </span>
          <button onClick={props.onShowFrise}>Voir la frise</button>
        </div>
      )}
      {analysis.status === "done" && analysis.timeline && (props.onProofread || analysis.timeline.proofreading) && (
        <div className="analysis-done">
          <span className="small">{proofreadingNote(analysis)}</span>
          {props.onProofread && (
            <button onClick={props.onProofread} disabled={analysis.proofreadingNow} title="Une demande de plus : le modèle relit chaque événement contre tout le texte, corrige les dates et les fins, retire ce qui n'y est pas, ajoute ce qui manque">
              {analysis.proofreadingNow ? "Relecture…" : analysis.timeline.proofreading ? "Relire encore" : "Relire contre le texte"}
            </button>
          )}
        </div>
      )}
      {analysis.status === "done" && segmentationNote(analysis.segmentedBy) && (
        <p className="small muted">{segmentationNote(analysis.segmentedBy)}</p>
      )}
    </div>
  );
}
