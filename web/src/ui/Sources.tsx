import type { Detection } from "../core/types";
import { FilePicker, PasteButton } from "./DropOverlay";
import type { SourceDocState } from "./state";

function StatusChip({ doc, count }: { doc: SourceDocState; count: number }) {
  switch (doc.status) {
    case "reading": {
      const p = doc.progress;
      const label = p?.phase === "ocr" && p.total > 0 ? `Lecture des scans ${p.done}/${p.total}` : "Analyse…";
      return <span className="chip chip-busy">{label}</span>;
    }
    case "review":
      return <span className="chip chip-review">À vérifier · {count}</span>;
    case "redacting":
      return <span className="chip chip-busy">Masquage…</span>;
    case "done":
      return doc.manifest?.verified ? (
        <span className="chip chip-ok">Vérifié ✓</span>
      ) : (
        <span className="chip chip-warn">À revoir</span>
      );
    case "error":
      return <span className="chip chip-warn">Erreur</span>;
  }
}

/** The original file's type ("PDF", "DOCX", "TXT"): every document is a PDF once opened. */
function fileLabel(name: string): string {
  const ext = name.match(/\.(\w{1,4})$/)?.[1];
  return ext ? ext.toUpperCase() : "PDF";
}

export function Sources(props: {
  docs: SourceDocState[];
  detections: Detection[];
  selected?: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onFiles: (files: File[]) => void;
}) {
  return (
    <aside className="panel sources">
      <div className="panel-head">
        <h2>Sources</h2>
        <span className="muted">{props.docs.length}</span>
      </div>
      <FilePicker onFiles={props.onFiles} className="add-source">
        + Ajouter des documents
      </FilePicker>
      <PasteButton onFiles={props.onFiles} className="add-source paste-source" />
      <ul className="source-list">
        {props.docs.map((doc) => {
          const count = props.detections.filter((d) => d.doc === doc.id && d.accepted).length;
          return (
            <li key={doc.id}>
              <button
                className={"source-card" + (doc.id === props.selected ? " selected" : "")}
                onClick={() => props.onSelect(doc.id)}
              >
                <span className="file-icon" aria-hidden>
                  {fileLabel(doc.name)}
                </span>
                <span className="source-meta">
                  <span className="source-name" title={doc.name}>
                    {doc.status === "done" ? doc.pseudoName : doc.name}
                  </span>
                  <span className="source-sub">
                    {doc.pages.length ? `${doc.pages.length} p.` : ""}
                    {doc.pages.some((p) => p.source === "ocr") ? " · scan" : ""}
                  </span>
                  <StatusChip doc={doc} count={count} />
                </span>
              </button>
              <button className="icon-btn remove" title="Retirer" onClick={() => props.onRemove(doc.id)}>
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
