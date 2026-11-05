import { useState } from "react";

import { decryptKeyfile, type KeyEntry } from "../core/keyfile";

/** Password for an encrypted correspondence table (.axkey), decrypted here. */
export function KeyPrompt(props: { data: Uint8Array; onKey: (entries: KeyEntry[]) => void; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      props.onKey(await decryptKeyfile(props.data, password));
      props.onClose();
    } catch {
      setError("Mot de passe incorrect, ou fichier qui n'est pas une table de correspondance.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <form
        className="modal"
        role="dialog"
        aria-modal
        aria-labelledby="key-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <h3 id="key-title">Table de correspondance</h3>
        <p className="muted small">
          Déchiffrée dans ce navigateur pour remettre les vrais noms sur la frise. Ni la table ni le mot de passe ne
          quittent ce poste.
        </p>
        <label>
          Mot de passe
          <input type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
        </label>
        {error && <p className="small error-text">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={props.onClose}>
            Annuler
          </button>
          <button type="submit" className="primary" disabled={busy || !password}>
            {busy ? "Déchiffrement…" : "Ouvrir"}
          </button>
        </div>
      </form>
    </div>
  );
}
