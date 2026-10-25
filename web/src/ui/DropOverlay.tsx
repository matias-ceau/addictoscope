import { useEffect, useState } from "react";

import { ACCEPTED_FILES } from "../core/inputs";

/** Full-window drop target: dragging documents anywhere over the app works. */
export function DropOverlay({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let depth = 0;
    const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes("Files");
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth++;
      setActive(true);
    };
    const over = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const leave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setActive(false);
    };
    const drop = (e: DragEvent) => {
      e.preventDefault();
      depth = 0;
      setActive(false);
      if (e.dataTransfer?.files.length) onFiles([...e.dataTransfer.files]);
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
  }, [onFiles]);

  if (!active) return null;
  return (
    <div className="drop-overlay" aria-hidden>
      <div className="drop-card">
        <UploadIcon size={40} />
        <strong>Déposez vos documents</strong>
        <span>Ils restent sur ce poste</span>
      </div>
    </div>
  );
}

export function UploadIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path d="M12 16V4m0 0l-4 4m4-4l4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function FilePicker({ onFiles, className, children }: { onFiles: (f: File[]) => void; className?: string; children: React.ReactNode }) {
  return (
    <label className={className}>
      <input
        type="file"
        accept={ACCEPTED_FILES}
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) onFiles([...e.target.files]);
          e.target.value = "";
        }}
      />
      {children}
    </label>
  );
}

let pasteCounter = 0;

/** "Coller du texte": a note copied from the patient record becomes a .txt document. */
export function PasteButton({ onFiles, className }: { onFiles: (f: File[]) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const close = () => {
    setOpen(false);
    setText("");
  };
  const add = () => {
    onFiles([new File([text], `texte-colle-${++pasteCounter}.txt`, { type: "text/plain" })]);
    close();
  };
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        Coller du texte
      </button>
      {open && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal wide" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
            <h3>Coller du texte</h3>
            <p className="muted small">
              Une note, un courrier copié depuis le dossier patient : il est traité comme un document, ici, sans rien
              envoyer.
            </p>
            <textarea className="paste-area" value={text} onChange={(e) => setText(e.target.value)} autoFocus aria-label="Texte à pseudonymiser" />
            <div className="modal-actions">
              <button className="ghost" onClick={close}>
                Annuler
              </button>
              <button className="primary" onClick={add} disabled={!text.trim()}>
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
