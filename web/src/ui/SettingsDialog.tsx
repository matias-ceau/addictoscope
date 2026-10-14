import { useState } from "react";

import { emptyPolicy, policyReady } from "../app/settings";
import type { CloudPolicy } from "../cloud/guard";

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
            <label>
              Modèle (multimodal, sorties JSON)
              <input value={draft.model} onChange={(e) => set({ model: e.target.value })} />
            </label>
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
