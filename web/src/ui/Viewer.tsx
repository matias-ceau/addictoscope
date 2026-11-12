import { useEffect, useRef, useState, type Dispatch } from "react";

import * as engine from "../app/engine";
import { spanForRect } from "../core/geometry";
import type { Detection, PageText, Rect } from "../core/types";
import { CATEGORY_INFO } from "./categories";
import type { Action, SourceDocState } from "./state";

const RENDER_ZOOM = 1.6;

export function Viewer(props: {
  doc: SourceDocState;
  view: "original" | "pseudo";
  onViewChange: (v: "original" | "pseudo") => void;
  detections: Detection[];
  focused?: string;
  dispatch: Dispatch<Action>;
  /** Lines to flash after a jump from the frise or the observations: the page to
   *  scroll to, and the lines of every page the observation runs over. */
  highlight?: { page: number; rects: Record<number, Rect[]>; key: number };
}) {
  const { doc, view } = props;

  useEffect(() => {
    if (!props.highlight) return;
    document.getElementById(`page-${props.highlight.page}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [props.highlight?.key]);
  const renderId = view === "pseudo" ? `${doc.id}:pseudo` : doc.id;
  const editable = doc.status === "review";
  // A finger on a page scrolls it. Drawing a frame by touch is asked for with the button, one frame at a time.
  const [drawing, setDrawing] = useState(false);
  useEffect(() => {
    if (!editable || view !== "original") setDrawing(false);
  }, [editable, view]);

  useEffect(() => {
    if (!props.focused) return;
    document.getElementById(`det-${props.focused}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [props.focused]);

  return (
    <section className="viewer">
      <div className="viewer-toolbar">
        <div className="doc-title" title={doc.name}>
          {view === "pseudo" ? doc.pseudoName : doc.name}
        </div>
        {doc.status === "done" && (
          <div className="segmented" role="tablist">
            <button role="tab" aria-selected={view === "original"} onClick={() => props.onViewChange("original")}>
              Original
            </button>
            <button role="tab" aria-selected={view === "pseudo"} onClick={() => props.onViewChange("pseudo")}>
              Pseudonymisé
            </button>
          </div>
        )}
        {editable && (
          <button type="button" className={"small-btn draw-toggle" + (drawing ? " on" : "")} aria-pressed={drawing} onClick={() => setDrawing(!drawing)}>
            {drawing ? "Annuler le cadre" : "Masquer une zone"}
          </button>
        )}
        {editable && (
          <span className="hint">
            {drawing ? "Glissez sur la zone à masquer" : <>Touchez un surlignage pour l'ignorer<span className="hint-mouse"> · à la souris, tracez un cadre pour masquer une zone</span></>}
          </span>
        )}
      </div>
      <div className="pages">
        {doc.status === "reading" && doc.pages.length === 0 && <ReadingPlaceholder doc={doc} />}
        {doc.pages.map((page) => (
          <PageView
            key={`${renderId}-${page.page}`}
            docId={renderId}
            page={page}
            detections={view === "original" ? props.detections.filter((d) => d.page === page.page) : []}
            focused={props.focused}
            highlight={props.highlight?.rects[page.page] ? { rects: props.highlight.rects[page.page], key: props.highlight.key } : undefined}
            editable={editable && view === "original"}
            drawing={drawing}
            onDrawn={() => setDrawing(false)}
            dispatch={props.dispatch}
            sourceDoc={doc.id}
          />
        ))}
      </div>
    </section>
  );
}

function ReadingPlaceholder({ doc }: { doc: SourceDocState }) {
  return (
    <div className="reading">
      <div className="spinner" />
      <p>Lecture de « {doc.name} »…</p>
    </div>
  );
}

function PageView(props: {
  docId: string;
  sourceDoc: string;
  page: PageText;
  detections: Detection[];
  focused?: string;
  editable: boolean;
  /** Frame drawing asked for with the button: the only way to draw with a finger. */
  drawing: boolean;
  onDrawn: () => void;
  dispatch: Dispatch<Action>;
  highlight?: { rects: Rect[]; key: number };
}) {
  const { page } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState<string>();
  const [draft, setDraft] = useState<{ from: [number, number]; to: [number, number] } | null>(null);

  // Render lazily, only when the page approaches the viewport.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let objectUrl: string | undefined;
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        engine.renderPage(props.docId, page.page, RENDER_ZOOM).then((blob) => {
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        });
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [props.docId, page.page]);

  const toPage = (e: React.PointerEvent): [number, number] => {
    const box = ref.current!.getBoundingClientRect();
    return [((e.clientX - box.left) / box.width) * page.width, ((e.clientY - box.top) / box.height) * page.height];
  };

  const finishDraft = () => {
    if (!draft) return;
    const rect: Rect = [
      Math.min(draft.from[0], draft.to[0]),
      Math.min(draft.from[1], draft.to[1]),
      Math.max(draft.from[0], draft.to[0]),
      Math.max(draft.from[1], draft.to[1]),
    ];
    setDraft(null);
    if (rect[2] - rect[0] < 4 || rect[3] - rect[1] < 4) return;
    props.onDrawn();
    const span = spanForRect(page, rect);
    props.dispatch({
      type: "addManual",
      detection: {
        id: `m${Date.now()}`,
        doc: props.sourceDoc,
        page: page.page,
        start: span?.start ?? 0,
        end: span?.end ?? 0,
        text: span ? page.text.slice(span.start, span.end) : "",
        category: "PERSONNE",
        source: "manual",
        entity: `MANUEL:${Date.now()}`,
        label: "[MASQUE]",
        rects: [rect],
        accepted: true,
      },
    });
  };

  const pct = (r: Rect) => ({
    left: `${(r[0] / page.width) * 100}%`,
    top: `${(r[1] / page.height) * 100}%`,
    width: `${((r[2] - r[0]) / page.width) * 100}%`,
    height: `${((r[3] - r[1]) / page.height) * 100}%`,
  });

  return (
    <div
      ref={ref}
      id={`page-${page.page}`}
      className={"page" + (props.editable ? " editable" : "") + (props.editable && props.drawing ? " drawing" : "")}
      style={{ aspectRatio: `${page.width} / ${page.height}` }}
      onPointerDown={(e) => {
        if (!props.editable || e.button !== 0 || (e.target as HTMLElement).closest(".box")) return;
        if (e.pointerType !== "mouse" && !props.drawing) return;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        const p = toPage(e);
        setDraft({ from: p, to: p });
      }}
      onPointerMove={(e) => draft && setDraft({ ...draft, to: toPage(e) })}
      onPointerUp={finishDraft}
      onPointerCancel={() => setDraft(null)}
    >
      {url ? <img src={url} alt={`Page ${page.page + 1}`} draggable={false} /> : <div className="page-skeleton" />}
      {props.detections.flatMap((d) =>
        d.rects.map((r, i) => (
          <button
            key={`${d.id}-${i}`}
            id={i === 0 ? `det-${d.id}` : undefined}
            className={"box" + (d.accepted ? "" : " rejected") + (props.focused === d.id ? " focused" : "")}
            style={{ ...pct(r), "--hue": CATEGORY_INFO[d.category].hue } as React.CSSProperties}
            title={`${CATEGORY_INFO[d.category].name} → ${d.label}${d.accepted ? "" : " (ignoré)"}`}
            disabled={!props.editable}
            onClick={() => props.dispatch({ type: "toggle", ids: [d.id], accepted: !d.accepted })}
          >
            {i === 0 && <span className="box-tag">{d.label}</span>}
          </button>
        )),
      )}
      {props.highlight?.rects.map((r, i) => (
        <div key={`${props.highlight!.key}-${i}`} className="source-highlight" style={pct(r)} />
      ))}
      {draft && (
        <div
          className="draft"
          style={pct([
            Math.min(draft.from[0], draft.to[0]),
            Math.min(draft.from[1], draft.to[1]),
            Math.max(draft.from[0], draft.to[0]),
            Math.max(draft.from[1], draft.to[1]),
          ])}
        />
      )}
      <span className="page-num">{page.page + 1}</span>
    </div>
  );
}
