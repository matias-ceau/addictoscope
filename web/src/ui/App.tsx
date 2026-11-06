import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { analyse } from "../app/analysis";
import { demoFiles, loadRecording, type DemoDossier } from "../app/demo";
import { loadDossierAnalysis, loadDossierFiles, loadDossierKey, remapAnalysis, type Library, type LibraryDossier } from "../app/library";
import { clearLedger } from "../cloud/ledger";
import { modelName } from "../cloud/models";
import { replayFetch } from "../cloud/replay";
import { parseAnalysis, serializeAnalysis, type SavedAnalysis } from "../app/saved";
import type { KeyEntry } from "../core/keyfile";
import { keyTableFromEntries, type KeyTable } from "../core/reidentify";
import * as engine from "../app/engine";
import { loadPolicy, policyReady, savePolicy } from "../app/settings";
import type { CloudPolicy } from "../cloud/guard";
import { rectsForSpan } from "../core/geometry";
import type { Rect } from "../core/types";
import { inputKind } from "../core/inputs";
import { keyTableFromDetections } from "../core/reidentify";
import { KeyPrompt } from "./KeyPrompt";
import { buildManifest } from "../core/verify";
import { detectCorpus } from "../pii/detect";
import { AnalysisCard, type AnalysisState } from "./AnalysisCard";
import { DataStatus, Journal } from "./Journal";
import { Journey, journeySteps } from "./Journey";
import { DropOverlay } from "./DropOverlay";
import { Frise } from "./Frise";
import { Observations } from "./Observations";
import { ReviewPanel } from "./ReviewPanel";
import { Sources } from "./Sources";
import { mergeDetections, reducer, type SourceDocState } from "./state";
import { SettingsDialog } from "./SettingsDialog";
import { Viewer } from "./Viewer";
import { Welcome } from "./Welcome";

let docCounter = 0;

/** Where a library dossier is: shown in the sidebar. */
export type LibraryDossierStatus = "loading" | "ready" | "error";

export interface LibraryProps {
  lib: Library;
  dossier: LibraryDossier;
  onStatus?: (status: LibraryDossierStatus) => void;
}

export function App(props: { library?: LibraryProps } = {}) {
  const library = props.library;
  const [state, dispatch] = useReducer(reducer, { docs: [], detections: [] });
  const stateRef = useRef(state);
  stateRef.current = state;
  const [view, setView] = useState<"original" | "pseudo">("original");
  const [mainView, setMainView] = useState<"doc" | "observations" | "frise">("doc");
  const [policy, setPolicy] = useState<CloudPolicy>(loadPolicy);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: "idle" });
  const [highlight, setHighlight] = useState<{ doc: string; page: number; rects: Rect[]; key: number }>();
  /** The fictional dossier on screen, in the demonstration. */
  const [demo, setDemo] = useState<DemoDossier | null>(null);
  /** Recording replayed by the demonstration's analysis, or "live". */
  const [demoSource, setDemoSource] = useState("");
  const [journalOpen, setJournalOpen] = useState(false);
  /** An analysis reopened from disk, with the real names if its .axkey was given. */
  const [reopened, setReopened] = useState<{ saved: SavedAnalysis; keyTable?: KeyTable } | null>(null);
  const [keyFile, setKeyFile] = useState<Uint8Array | null>(null);
  const [reopenError, setReopenError] = useState<string | null>(null);
  /** Library: table of the saved analysis (label -> real value), when given. */
  const [libraryKey, setLibraryKey] = useState<KeyTable | undefined>();

  const redetect = useCallback(() => {
    const ready = stateRef.current.docs.filter((d) => d.pages.length && d.status !== "reading" && d.status !== "error");
    const fresh = detectCorpus(ready.map((d) => ({ id: d.id, pages: d.pages, ner: d.ner?.spans })));
    const action = { type: "detections" as const, detections: mergeDetections(stateRef.current.detections, fresh) };
    dispatch(action);
    // Read right away by an automatic pseudonymisation (library), before the next render.
    stateRef.current = reducer(stateRef.current, action);
  }, []);

  const addFiles = useCallback(
    async (files: File[], opts: { ner?: boolean } = {}): Promise<string[]> => {
      const ids: string[] = [];
      for (const file of files) {
        const id = `doc${++docCounter}`;
        ids.push(id);
        const raw = new Uint8Array(await file.arrayBuffer());
        const kind = inputKind(file.name, raw);
        const doc: SourceDocState = {
          id,
          name: file.name,
          pseudoName: `document-${String(docCounter).padStart(2, "0")}-pseudonymise.pdf`,
          bytes: raw,
          status: "reading",
          pages: [],
        };
        dispatch({ type: "add", doc });
        if (!kind) {
          const error = "Format non pris en charge : enregistrez-le en PDF, en Word (.docx) ou en texte (.txt).";
          dispatch({ type: "patch", id, patch: { status: "error", error } });
          continue;
        }
        try {
          // Text and Word documents are laid out as a PDF first; everything after is the same.
          const bytes = await engine.toPdf(raw.slice(), kind);
          dispatch({ type: "patch", id, patch: { bytes } });
          const pages = await engine.analyse(id, bytes.slice(), (done, total, phase) =>
            dispatch({ type: "patch", id, patch: { progress: { done, total, phase } } }),
          );
          const patch = { pages, status: "review" as const, progress: undefined, ner: { status: "running" as const, done: 0, total: pages.length } };
          dispatch({ type: "patch", id, patch });
          stateRef.current = reducer(stateRef.current, { type: "patch", id, patch });
          redetect();
          if (opts.ner === false) {
            const ner = { status: "skipped" as const, done: 0, total: 0 };
            dispatch({ type: "patch", id, patch: { ner } });
            stateRef.current = reducer(stateRef.current, { type: "patch", id, patch: { ner } });
            continue;
          }
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
      return ids;
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
      const places = stateRef.current.detections.filter((d) => d.doc === id && !d.accepted && d.category === "VILLE").map((d) => d.text);
      const manifest = await buildManifest(output, pages, accepted, true, places);
      dispatch({ type: "patch", id, patch: { status: "done", output, outPages: pages, manifest } });
      setView("pseudo");
    } catch (err) {
      dispatch({ type: "patch", id, patch: { status: "error", error: String((err as Error).message ?? err) } });
    }
  }, []);

  const removeDoc = useCallback((id: string) => {
    engine.close(id);
    dispatch({ type: "remove", id });
  }, []);

  const verified = state.docs.filter((d) => d.status === "done" && d.manifest?.verified && d.outPages);

  const runAnalysis = useCallback(async () => {
    const docs = stateRef.current.docs.filter((d) => d.status === "done" && d.manifest?.verified && d.outPages);
    setAnalysis({ status: "running", docs: docs.map((d) => d.id) });
    try {
      // Demonstration: the recorded answers stand in for the network; the
      // guard, the requests and every local step run as they would live.
      const recording = demo && demoSource !== "live" ? demo.recordings.find((r) => r.file === demoSource) : undefined;
      const replay = recording ? await loadRecording(demo!, recording) : undefined;
      const runPolicy: CloudPolicy = replay ? { kind: "openrouter-zdr", apiKey: "", model: replay.model } : policy;
      const result = await analyse(
        docs.map((d) => ({ id: d.id, pages: d.outPages!, manifest: d.manifest })),
        runPolicy,
        (progress) => setAnalysis((a) => ({ ...a, progress })),
        stateRef.current.detections,
        replay ? replayFetch(replay, 700) : undefined,
      );
      const model = runPolicy.kind === "off" ? undefined : runPolicy.model;
      setAnalysis({ status: "done", ...result, docs: docs.map((d) => d.id), model, replayed: Boolean(replay) });
      setMainView("frise");
    } catch (err) {
      setAnalysis({ status: "error", error: String((err as Error).message ?? err) });
    }
  }, [policy, demo, demoSource]);

  // Library: the dossier goes through the local path on its own (every
  // detection accepted, as for the recorded run), then its saved analysis
  // stands in for the call to the model. Nothing is sent.
  const onLibraryStatus = library?.onStatus;
  const libraryStarted = useRef(false);
  useEffect(() => {
    // Once per dossier (the ref survives StrictMode's second mount; the
    // library keeps every opened dossier mounted).
    if (!library || libraryStarted.current) return;
    libraryStarted.current = true;
    const { lib, dossier } = library;
    void (async () => {
      onLibraryStatus?.("loading");
      try {
        const files = await loadDossierFiles(lib, dossier);
        const ids: Record<string, string> = {};
        for (const [i, f] of files.entries()) {
          if (f instanceof Error) {
            const id = `doc${++docCounter}`;
            dispatch({ type: "add", doc: { id, name: dossier.docs[i].file, pseudoName: "", bytes: new Uint8Array(), status: "error", pages: [], error: f.message } });
            continue;
          }
          const [id] = await addFiles([f], { ner: false });
          ids[dossier.docs[i].id] = id;
        }
        for (const id of Object.values(ids)) {
          if (stateRef.current.docs.find((d) => d.id === id)?.status === "review") await pseudonymise(id);
        }
        const [saved, key] = await Promise.all([loadDossierAnalysis(lib, dossier), loadDossierKey(lib, dossier)]);
        const analysed = remapAnalysis(saved, ids);
        setLibraryKey(key);
        setAnalysis({
          status: "done",
          observations: analysed.observations,
          timeline: analysed.timeline,
          docs: Object.values(ids),
          model: analysed.model,
          replayed: true,
        });
        dispatch({ type: "select", id: Object.values(ids)[0] ?? stateRef.current.docs[0]?.id });
        onLibraryStatus?.("ready");
      } catch (err) {
        setAnalysis({ status: "error", error: String((err as Error).message ?? err) });
        onLibraryStatus?.("error");
      }
    })();
    // One run per dossier: the library mounts one App per dossier.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDemo = useCallback(
    async (d: DemoDossier) => {
      setDemo(d);
      setDemoSource(d.recordings[0]?.file ?? "live");
      await addFiles(await demoFiles(d));
    },
    [addFiles],
  );

  /** Back to the welcome screen: documents, analysis and journal forgotten. */
  const closeAll = useCallback(() => {
    for (const d of stateRef.current.docs) removeDoc(d.id);
    clearLedger();
    setAnalysis({ status: "idle" });
    setMainView("doc");
    setDemo(null);
    setReopened(null);
  }, [removeDoc]);

  /** Save the current analysis: pseudonymized, as the model returned it. */
  const saveAnalysis = useCallback(() => {
    if (!analysis.timeline || !analysis.observations) return;
    const text = serializeAnalysis({ observations: analysis.observations, timeline: analysis.timeline, model: analysis.model, replayed: analysis.replayed });
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "analyse-pseudonymisee.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [analysis]);

  /** Reopen a saved analysis (.json), and its table (.axkey) if given. */
  const reopen = useCallback(async (files: File[]) => {
    setReopenError(null);
    const json = files.find((f) => /\.json$/i.test(f.name));
    const key = files.find((f) => /\.axkey$/i.test(f.name));
    try {
      if (json) setReopened({ saved: parseAnalysis(await json.text()) });
      else if (!reopened) throw new Error("Choisissez le fichier d'analyse (.json), et si vous l'avez sa table de correspondance (.axkey).");
      if (key) setKeyFile(new Uint8Array(await key.arrayBuffer()));
    } catch (err) {
      setReopenError(String((err as Error).message ?? err));
    }
  }, [reopened]);

  const onKey = useCallback((entries: KeyEntry[]) => {
    setReopened((r) => (r ? { ...r, keyTable: keyTableFromEntries(entries) } : r));
  }, []);

  /** Labels of the analysed documents -> real values, for the frise only (local). */
  const keyTable = useMemo(() => {
    if (libraryKey) return libraryKey;
    const docs = new Set(analysis.docs ?? []);
    return keyTableFromDetections(state.detections.filter((d) => docs.has(d.doc)));
  }, [state.detections, analysis.docs, libraryKey]);

  /** Jump from a frise event to the observation it came from, highlighted:
   *  on the original page when the frise shows real names, else the pseudonymized one. */
  const openSource = useCallback(
    (observationId: string, real = false) => {
      const o = analysis.observations?.find((x) => x.id === observationId);
      const doc = stateRef.current.docs.find((d) => d.id === o?.doc);
      const page = doc?.outPages?.find((p) => p.page === o?.start.page);
      if (!o || !doc || !page) return;
      const lines = page.text.split("\n");
      let start = 0;
      for (let i = 0; i < o.start.line - 1; i++) start += lines[i].length + 1;
      let end = start;
      const lastLine = o.end.page === o.start.page ? o.end.line : lines.length;
      for (let i = o.start.line - 1; i < lastLine; i++) end += (lines[i]?.length ?? 0) + 1;
      dispatch({ type: "select", id: doc.id });
      setView(real ? "original" : "pseudo");
      setMainView("doc");
      setHighlight({ doc: doc.id, page: page.page, rects: rectsForSpan(page, start, end), key: Date.now() });
    },
    [analysis.observations],
  );

  const selected = state.docs.find((d) => d.id === state.selectedDoc);
  const replayMode = Boolean(library) || (demo !== null && demoSource !== "live");
  const steps = journeySteps(
    state.docs,
    analysis,
    replayMode ? "replay" : policy.kind === "off" ? "off" : "online",
    mainView === "frise",
  );
  const realValues = useMemo(
    () => [...new Set(state.detections.filter((d) => d.accepted).map((d) => d.text))],
    [state.detections],
  );
  const docNames = useMemo(() => Object.fromEntries(state.docs.map((d) => [d.id, d.name])), [state.docs]);
  const allVerified = state.docs.length > 0 && state.docs.every((d) => d.status === "done" && d.manifest?.verified);
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
          {library && (
            <span className="demo-ribbon library-ribbon" title="Dossier déjà analysé : frise enregistrée, rien n'est envoyé">
              {library.dossier.title}
            </span>
          )}
          {demo && (
            <span className="demo-ribbon" title="Dossier entièrement inventé, pour la démonstration">
              Dossier fictif · démonstration
            </span>
          )}
        </div>
        <div className="topbar-right">
        {analysis.timeline && (
          <div className="segmented" role="tablist">
            <button role="tab" aria-selected={mainView === "doc"} onClick={() => setMainView("doc")}>
              Documents
            </button>
            <button role="tab" aria-selected={mainView === "observations"} onClick={() => setMainView("observations")}>
              Observations
            </button>
            <button role="tab" aria-selected={mainView === "frise"} onClick={() => setMainView("frise")}>
              Frise
            </button>
          </div>
        )}
        <DataStatus demo={replayMode && !library} onOpen={() => setJournalOpen(true)} />
        <button className="cloud-badge" onClick={() => setSettingsOpen(true)} title="Réglages de l'IA en ligne">
          IA en ligne : {policy.kind === "off" ? "désactivée" : policy.kind === "openrouter-zdr" ? "OpenRouter ZDR" : "point d'accès HDS"}
        </button>
        {!library && (state.docs.length > 0 || reopened) && (
          <button className="cloud-badge" onClick={closeAll} title="Fermer tous les documents et revenir à l'accueil">
            {demo ? "Quitter la démonstration" : "Tout fermer"}
          </button>
        )}
        </div>
      </header>
      {state.docs.length > 0 && <Journey steps={steps} />}

      {state.docs.length === 0 && reopened ? (
        <main className="workspace single">
          <Frise
            key={reopened.keyTable ? "with-key" : "no-key"}
            timeline={reopened.saved.timeline}
            observations={reopened.saved.observations}
            keyTable={reopened.keyTable}
            source={`Analyse rouverte${reopened.saved.model ? ` : ${modelName(reopened.saved.model)}` : ""}${reopened.saved.createdAt ? `, enregistrée le ${new Date(reopened.saved.createdAt).toLocaleDateString("fr-FR")}` : ""}`}
            onImportKey={(files) => void reopen(files)}
          />
        </main>
      ) : state.docs.length === 0 && library ? (
        <main className="workspace single">
          <p className="library-loading muted">Ouverture du dossier…</p>
        </main>
      ) : state.docs.length === 0 ? (
        <Welcome onFiles={addFiles} onDemo={openDemo} onReopen={(f) => void reopen(f)} reopenError={reopenError} />
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
          {mainView === "observations" && analysis.observations && (
            <Observations observations={analysis.observations} docNames={docNames} keyTable={keyTable} onOpenSource={openSource} />
          )}
          {mainView === "frise" && analysis.timeline && (
            <Frise
              key={libraryKey ? "library-key" : "session-key"}
              timeline={analysis.timeline}
              observations={analysis.observations ?? []}
              keyTable={keyTable}
              onOpenSource={openSource}
              onSave={saveAnalysis}
              source={
                analysis.model &&
                (library
                  ? `Analyse enregistrée : ${modelName(analysis.model)}${library.dossier.cost !== undefined ? `, ${library.dossier.cost.toFixed(2).replace(".", ",")} $` : ""} (aucun envoi)`
                  : `Analyse : ${modelName(analysis.model)}${analysis.replayed ? ", réponses enregistrées rejouées (aucun envoi)" : ", OpenRouter sans conservation"}`)
              }
            />
          )}
          {mainView === "doc" && selected && (
            <Viewer
              highlight={highlight?.doc === selected.id ? highlight : undefined}
              key={selected.id}
              doc={selected}
              view={selected.status === "done" ? view : "original"}
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
              nextStep={
                <AnalysisCard
                  verifiedCount={verified.length}
                  policy={policy}
                  ready={policyReady(policy)}
                  analysis={analysis}
                  onConfigure={() => setSettingsOpen(true)}
                  onRun={runAnalysis}
                  onShowFrise={() => setMainView("frise")}
                  demo={demo ? { dossier: demo, allVerified, source: demoSource, onSource: setDemoSource } : undefined}
                />
              }
            />
          )}
        </main>
      )}
      {!library && <DropOverlay onFiles={addFiles} />}
      {keyFile && <KeyPrompt data={keyFile} onKey={onKey} onClose={() => setKeyFile(null)} />}
      {journalOpen && <Journal onClose={() => setJournalOpen(false)} realValues={realValues} docNames={docNames} />}
      {settingsOpen && (
        <SettingsDialog
          policy={policy}
          onSave={(p) => {
            setPolicy(p);
            savePolicy(p);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
