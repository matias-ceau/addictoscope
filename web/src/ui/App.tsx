import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import * as engine from "../app/engine";
import { buildManifest } from "../core/verify";
import { detectCorpus } from "../pii/detect";
import { DropOverlay } from "./DropOverlay";
import { ReviewPanel } from "./ReviewPanel";
import { Sources } from "./Sources";
import { mergeDetections, reducer, type SourceDocState } from "./state";
import { Viewer } from "./Viewer";
import { Welcome } from "./Welcome";

let docCounter = 0;

export function App() {
  const [state, dispatch] = useReducer(reducer, { docs: [], detections: [] });
  const stateRef = useRef(state);
  stateRef.current = state;
  const [view, setView] = useState<"original" | "pseudo">("original");

  const redetect = useCallback(() => {
    const ready = stateRef.current.docs.filter((d) => d.pages.length && d.status !== "reading" && d.status !== "error");
    const fresh = detectCorpus(ready.map((d) => ({ id: d.id, pages: d.pages, ner: d.ner?.spans })));
    dispatch({ type: "detections", detections: mergeDetections(stateRef.current.detections, fresh) });
  }, []);

  const addFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) continue;
        const id = `doc${++docCounter}`;
        const bytes = new Uint8Array(await file.arrayBuffer());
        const doc: SourceDocState = {
          id,
          name: file.name,
          pseudoName: `document-${String(docCounter).padStart(2, "0")}-pseudonymise.pdf`,
          bytes,
          status: "reading",
          pages: [],
        };
        dispatch({ type: "add", doc });
        try {
          const pages = await engine.analyse(id, bytes.slice(), (done, total, phase) =>
            dispatch({ type: "patch", id, patch: { progress: { done, total, phase } } }),
          );
          const patch = { pages, status: "review" as const, progress: undefined, ner: { status: "running" as const, done: 0, total: pages.length } };
          dispatch({ type: "patch", id, patch });
          stateRef.current = reducer(stateRef.current, { type: "patch", id, patch });
          redetect();
          // Second opinion from the local AI model, in the background: the
          // reviewer can start on the rule-based detections meanwhile, and
          // the next file is read without waiting for it.
          void engine
            .runNer(pages, (done, total) => dispatch({ type: "patch", id, patch: { ner: { status: "running", done, total } } }))
            .catch(() => null)
            .then((spans) => {
              const ner = spans
                ? { status: "done" as const, done: pages.length, total: pages.length, spans }
                : { status: "unavailable" as const, done: 0, total: 0 };
              dispatch({ type: "patch", id, patch: { ner } });
              stateRef.current = reducer(stateRef.current, { type: "patch", id, patch: { ner } });
              redetect();
            });
        } catch (err) {
          dispatch({ type: "patch", id, patch: { status: "error", error: String((err as Error).message ?? err) } });
        }
      }
    },
    [redetect],
  );

  const pseudonymise = useCallback(async (id: string) => {
    const doc = stateRef.current.docs.find((d) => d.id === id);
    if (!doc) return;
    dispatch({ type: "patch", id, patch: { status: "redacting" } });
    try {
      const accepted = stateRef.current.detections.filter((d) => d.doc === id && d.accepted);
      const ocrPages = doc.pages.filter((p) => p.source === "ocr").map((p) => p.page);
      const { output, pages } = await engine.redact(
        id,
        accepted.map((d) => ({ page: d.page, rects: d.rects, label: d.label })),
        ocrPages,
      );
      const manifest = await buildManifest(output, pages, accepted, true);
      dispatch({ type: "patch", id, patch: { status: "done", output, manifest } });
      setView("pseudo");
    } catch (err) {
      dispatch({ type: "patch", id, patch: { status: "error", error: String((err as Error).message ?? err) } });
    }
  }, []);

  const removeDoc = useCallback((id: string) => {
    engine.close(id);
    dispatch({ type: "remove", id });
  }, []);

  const selected = state.docs.find((d) => d.id === state.selectedDoc);
  useEffect(() => {
    if (selected?.status !== "done") setView("original");
  }, [selected?.id, selected?.status]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>
            <svg viewBox="0 0 32 32" width="22" height="22">
              <path d="M5 22h5l3-9 4 13 3-8h7" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          addictoscope
        </div>
        <div className="privacy-badge" title="Lecture, détection et masquage s'exécutent dans ce navigateur. Aucun fichier n'est envoyé.">
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
            <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Traitement local · rien ne quitte ce poste
        </div>
      </header>

      {state.docs.length === 0 ? (
        <Welcome onFiles={addFiles} />
      ) : (
        <main className="workspace">
          <Sources
            docs={state.docs}
            detections={state.detections}
            selected={state.selectedDoc}
            onSelect={(id) => dispatch({ type: "select", id })}
            onRemove={removeDoc}
            onFiles={addFiles}
          />
          {selected && (
            <Viewer
              key={selected.id}
              doc={selected}
              view={view}
              onViewChange={setView}
              detections={state.detections.filter((d) => d.doc === selected.id)}
              focused={state.focusedDetection}
              dispatch={dispatch}
            />
          )}
          {selected && (
            <ReviewPanel
              doc={selected}
              detections={state.detections}
              dispatch={dispatch}
              onPseudonymise={() => pseudonymise(selected.id)}
            />
          )}
        </main>
      )}
      <DropOverlay onFiles={addFiles} />
    </div>
  );
}
