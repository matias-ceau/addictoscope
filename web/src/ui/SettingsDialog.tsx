import { useState } from "react";

import { emptyPolicy, policyReady } from "../app/settings";
import type { CloudPolicy } from "../cloud/guard";
import { MODELS } from "../cloud/models";

const CHOICES: { kind: CloudPolicy["kind"]; title: string; text: string }[] = [
  { kind: "off", title: "Désactivée", text: "Aucun appel à un modèle en ligne. La pseudonymisation reste disponible." },
  {
    kind: "openrouter-zdr",
    title: "OpenRouter, zéro conservation",
    text: "Requêtes routées uniquement vers des fournisseurs sans conservation ni entraînement (ZDR). Pour la démonstration et la recherche validée par le DPO.",
  },
  {
    kind: "custom-endpoint",
    title: "Point d'accès de l'établissement (HDS)",
    text: "API compatible OpenAI hébergée sur une infrastructure certifiée HDS (ex. passerelle vers Bedrock Paris ou Azure France).",
  },
];

export function SettingsDialog(props: { policy: CloudPolicy; onSave: (p: CloudPolicy) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<CloudPolicy>(props.policy);
  const set = (patch: Partial<Record<"apiKey" | "model" | "url", string>>) => setDraft({ ...draft, ...patch } as CloudPolicy);

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <div className="modal wide" role="dialog" aria-modal aria-labelledby="settings-title" onClick={(e) => e.stopPropagation()}>
        <h3 id="settings-title">IA en ligne</h3>
        <p className="muted small">
          Le modèle en ligne ne reçoit que des documents <strong>pseudonymisés et vérifiés</strong> : l'application le
          refuse pour tout autre document. Pour un usage hospitalier réel, l'accord du DPO est requis.
        </p>
        <div className="choices" role="radiogroup">
          {CHOICES.map((c) => (
            <label key={c.kind} className={"choice" + (draft.kind === c.kind ? " selected" : "")}>
              <input
                type="radio"
                name="policy"
                checked={draft.kind === c.kind}
                onChange={() => setDraft(c.kind === props.policy.kind ? props.policy : emptyPolicy(c.kind))}
              />
              <span>
                <strong>{c.title}</strong>
                <span className="muted small">{c.text}</span>
              </span>
            </label>
          ))}
        </div>

        {draft.kind === "custom-endpoint" && (
          <label>
            Adresse (https://…/chat/completions)
            <input value={draft.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://" />
          </label>
        )}
        {draft.kind !== "off" && (
          <>
            <label>
              Clé d'API
              <input type="password" value={draft.apiKey} onChange={(e) => set({ apiKey: e.target.value })} autoComplete="off" />
            </label>
            {draft.kind === "openrouter-zdr" && (
              <div className="model-list" role="radiogroup" aria-label="Modèle">
                {MODELS.map((m) => (
                  <label key={m.id} className={"choice model-choice" + (draft.model === m.id ? " selected" : "")}>
                    <input type="radio" name="model" checked={draft.model === m.id} onChange={() => set({ model: m.id })} />
                    <span>
                      <strong>
                        {m.name} <span className="muted small">{m.maker}</span>
                        {m.tag && <span className="model-tag">{m.tag}</span>}
                      </strong>
                      <span className="model-stats">
                        {m.recall !== undefined && <span>Rappel {Math.round(m.recall * 100)} %</span>}
                        {m.costPerRealDossier !== undefined && <span>≈ {m.costPerRealDossier.toFixed(2)} $ / dossier réel</span>}
                      </span>
                      {m.note && <span className="muted small">{m.note}</span>}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <label>
              Découpage en observations
              <select
                value={draft.segmentModel ?? ""}
                onChange={(e) => setDraft({ ...draft, segmentModel: e.target.value || undefined } as CloudPolicy)}
              >
                <option value="">Même modèle que la frise</option>
                {MODELS.filter((m) => m.id !== draft.model).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <span className="muted small" style={{ fontWeight: 400 }}>
                Le découpage reçoit les images des pages : c'est la plus grosse part du coût. Claude Haiku 5.5 pour le
                découpage et Claude Sonnet 5.5 pour la frise : 86 % des événements retrouvés (contre 88 %), coût réduit
                d'un tiers.
              </span>
            </label>
            <label>
              Identifiant du modèle (multimodal, sorties JSON)
              <input value={draft.model} onChange={(e) => set({ model: e.target.value })} />
            </label>
            {draft.kind === "openrouter-zdr" && (
              <p className="muted small">
                Rappel : part des événements attendus retrouvés sur 14 dossiers fictifs (un passage). Tous ces modèles sont
                joints par OpenRouter avec zéro conservation.
              </p>
            )}
            <p className="muted small">La clé est conservée dans ce navigateur uniquement.</p>
          </>
        )}

        <div className="modal-actions">
          <button className="ghost" onClick={props.onClose}>
            Annuler
          </button>
          <button
            className="primary"
            disabled={draft.kind !== "off" && !policyReady(draft)}
            onClick={() => {
              props.onSave(draft);
              props.onClose();
            }}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
