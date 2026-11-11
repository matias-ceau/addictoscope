import { useState } from "react";

import { addEvent, draftError, draftOf, mergeEvents, parseDateInput, removeEvent, setKey, updateEvent, type EventDraft } from "../notebook/edit";
import { dateEnd, dateStart, TRACK_KIND_LABEL, TRACK_KINDS, USAGE_MODES, type Observation, type Timeline, type TimelineEvent, type TrackKind, type UsageMode } from "../notebook/model";

export function formatDate(s: string): string {
  const [y, m, d] = s.split("-");
  if (d) return `${d}/${m}/${y}`;
  if (m) return `${m}/${y}`;
  return y;
}

export const period = (e: Pick<TimelineEvent, "start" | "end" | "ongoing">) => `${formatDate(e.start)}${e.end ? ` → ${formatDate(e.end)}` : e.ongoing ? " → en cours" : ""}`;

export type EditTarget = { id: string } | { preset: { kind: TrackKind; label: string } };

/**
 * The card of one event: where it comes from, and what can be corrected.
 * It always edits the pseudonymized frise, so that a real name shown on
 * screen is never written into what gets saved.
 */
export function EventEditor(props: {
  timeline: Timeline;
  target: EditTarget;
  observations: Observation[];
  /** Real names are shown on the frise: say that the note is edited under its labels. */
  real: boolean;
  onOpenSource?: (observationId: string) => void;
  /** Absent: the card only shows the event. */
  onChange?: (t: Timeline) => void;
  onClose: () => void;
}) {
  const t = props.timeline;
  const event = "id" in props.target ? t.events.find((e) => e.id === (props.target as { id: string }).id) : undefined;
  const initial: EventDraft = event
    ? draftOf(t, event)
    : { kind: "life_event", label: "", start: "", end: null, ongoing: false, mode: null, lossOfControl: false, note: "", ...("preset" in props.target ? props.target.preset : {}) };
  const [draft, setDraft] = useState(initial);
  const [start, setStart] = useState(initial.start ? formatDate(initial.start) : "");
  const [end, setEnd] = useState(initial.end ? formatDate(initial.end) : "");
  const [landmark, setLandmark] = useState<boolean | undefined>(event?.key);
  const [error, setError] = useState<string | null>(null);
  const [mergeWith, setMergeWith] = useState("");
  const set = (patch: Partial<EventDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const editable = Boolean(props.onChange);
  const siblings = event ? t.events.filter((e) => e.trackId === event.trackId && e.id !== event.id).sort((a, b) => dateStart(a.start) - dateStart(b.start)) : [];
  const labels = [...new Set(t.tracks.filter((x) => x.kind === draft.kind).map((x) => x.label))].sort((a, b) => a.localeCompare(b, "fr"));

  const save = () => {
    const full: EventDraft = { ...draft, start: parseDateInput(start) ?? start.trim(), end: end.trim() ? parseDateInput(end) ?? end.trim() : null };
    const problem = draftError(full);
    if (problem) return setError(problem);
    let next = event ? updateEvent(t, event.id, full) : addEvent(t, full);
    const id = event?.id ?? next.events.at(-1)!.id;
    if (landmark !== event?.key) next = setKey(next, id, landmark);
    props.onChange!(next);
    props.onClose();
  };
  const apply = (next: Timeline) => {
    props.onChange!(next);
    props.onClose();
  };

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <div className="modal event-editor" role="dialog" aria-modal aria-labelledby="event-editor-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="event-editor-title">{event ? "Événement" : "Ajouter un événement"}</h2>
        {event?.edited && <p className="chip chip-warn">{event.edited === "added" ? "Ajouté à la main" : "Corrigé à la main"}</p>}
        {props.real && editable && <p className="muted small">La note se corrige sous sa forme pseudonymisée : les vrais noms ne sont jamais enregistrés.</p>}

        <div className="editor-grid">
          <label>
            Rubrique
            <select value={draft.kind} disabled={!editable} onChange={(e) => set({ kind: e.target.value as TrackKind })}>
              {TRACK_KINDS.map((k) => (
                <option key={k} value={k}>
                  {TRACK_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ligne
            <input value={draft.label} disabled={!editable} list="editor-track-labels" placeholder="Alcool, Jeux vidéo, Hospitalisation…" onChange={(e) => set({ label: e.target.value })} />
            <datalist id="editor-track-labels">
              {labels.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </label>
          <label>
            Début
            <input value={start} disabled={!editable} inputMode="numeric" placeholder="2013, 05/2013 ou 12/05/2013" onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            Fin
            <input value={draft.ongoing ? "" : end} disabled={!editable || draft.ongoing} inputMode="numeric" placeholder="vide : événement ponctuel" onChange={(e) => setEnd(e.target.value)} />
          </label>
          <label className="inline">
            <input type="checkbox" checked={draft.ongoing} disabled={!editable} onChange={(e) => set({ ongoing: e.target.checked })} /> Toujours en cours
          </label>
          {draft.kind === "substance_use" && (
            <>
              <label>
                Nature
                <select value={draft.mode ?? ""} disabled={!editable} onChange={(e) => set({ mode: (e.target.value || null) as UsageMode | null })}>
                  <option value="">non précisée</option>
                  {USAGE_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="inline">
                <input type="checkbox" checked={draft.lossOfControl} disabled={!editable} onChange={(e) => set({ lossOfControl: e.target.checked })} /> Perte de contrôle
              </label>
            </>
          )}
          <label className="wide">
            Note
            <textarea value={draft.note} disabled={!editable} rows={3} onChange={(e) => set({ note: e.target.value })} />
          </label>
          {editable && (
            <label className="inline wide" title="La vue « Essentiel » montre une dizaine de repères du parcours">
              <select value={landmark === undefined ? "" : landmark ? "in" : "out"} onChange={(e) => setLandmark(e.target.value === "" ? undefined : e.target.value === "in")}>
                <option value="">Repère de la vue « Essentiel » : choix automatique</option>
                <option value="in">Toujours dans la vue « Essentiel »</option>
                <option value="out">Jamais dans la vue « Essentiel »</option>
              </select>
            </label>
          )}
        </div>

        {event && (
          <div className="editor-sources">
            <strong className="small">D'où vient cet événement</strong>
            {event.observationIds.length === 0 && <p className="muted small">Ajouté à la main : aucune observation source.</p>}
            {event.observationIds.map((id) => {
              const o = props.observations.find((x) => x.id === id);
              return (
                <p key={id} className="small">
                  <button
                    className="link"
                    onClick={() => {
                      props.onOpenSource?.(id);
                      props.onClose();
                    }}
                    disabled={!props.onOpenSource}
                  >
                    {o?.date ? formatDate(o.date) : "Observation"}
                  </button>{" "}
                  <span className="muted">{o?.summary}</span>
                </p>
              );
            })}
            {(event.tellings?.length ?? 0) > 1 && (
              <ul className="muted small">
                {event.tellings!.map((m, i) => (
                  <li key={i}>
                    {m.start ? formatDate(m.start) : "sans date"} : {m.note}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {editable && event && siblings.length > 0 && (
          <div className="editor-merge">
            <select value={mergeWith} onChange={(e) => setMergeWith(e.target.value)} aria-label="Fusionner avec un autre événement de la même ligne">
              <option value="">Fusionner avec un événement de la même ligne…</option>
              {siblings.map((s) => (
                <option key={s.id} value={s.id}>
                  {period(s)}
                  {s.note ? ` — ${s.note.slice(0, 60)}` : ""}
                </option>
              ))}
            </select>
            <button className="small-btn" disabled={!mergeWith} onClick={() => apply(mergeEvents(t, event.id, mergeWith))}>
              Fusionner
            </button>
          </div>
        )}

        {error && <p className="small error-text">{error}</p>}
        <div className="modal-actions">
          {editable && event && (
            <button className="ghost danger" onClick={() => apply(removeEvent(t, event.id))}>
              Supprimer
            </button>
          )}
          <button className="ghost" onClick={props.onClose}>
            {editable ? "Annuler" : "Fermer"}
          </button>
          {editable && (
            <button className="primary" onClick={save}>
              Enregistrer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const KIND_COLOR: Record<TrackKind, string> = {
  substance_use: "#2a78d6",
  psychiatric: "#eb6834",
  somatic: "#1baf7a",
  medication: "#eda100",
  therapeutic_psycho: "#e87ba4",
  life_event: "#008300",
};

/** A note that only repeats the name of its line adds nothing to a card. */
const same = (a: string, b: string) => a.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "") === b.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

function wrap(text: string, perLine: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && (line + " " + word).length > perLine) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) return [...lines.slice(0, maxLines - 1), lines[maxLines - 1].slice(0, perLine - 1) + "…"];
  return lines;
}

/**
 * The course in about ten landmarks, as a clinician would draw it for a
 * staff meeting: a line, a date and an age per landmark, a few words. Drawn
 * with inline styles only, so that the picture exports as it is shown.
 */
export function Essentiel(props: {
  events: TimelineEvent[];
  timeline: Timeline;
  birthYear: number | null;
  followUpFrom: number | null;
  width: number;
  onPick: (e: TimelineEvent) => void;
}) {
  const M = 16;
  const GAP = 14;
  const cols = Math.max(2, Math.min(5, Math.floor((props.width - 2 * M) / 190)));
  const cardW = (props.width - 2 * M - (cols - 1) * GAP) / cols;
  const perLine = Math.floor((cardW - 20) / 6.4);
  const track = Object.fromEntries(props.timeline.tracks.map((x) => [x.id, x]));
  const year = (s: string) => Number(s.slice(0, 4));
  const cards = props.events.map((e) => {
    const y0 = year(e.start);
    const y1 = e.end ? year(e.end) : null;
    const span = y1 !== null && y1 !== y0;
    const age = props.birthYear ? (span ? `${y0 - props.birthYear}-${y1! - props.birthYear} ans` : `${y0 - props.birthYear} ans`) : null;
    const title = wrap(track[e.trackId].label + (e.lossOfControl ? " (perte de contrôle)" : ""), perLine, 2);
    return { e, when: span ? `${y0}-${y1}` : e.ongoing ? `depuis ${formatDate(e.start)}` : formatDate(e.start), age, title, body: same(e.note, track[e.trackId].label) ? [] : wrap(e.note, perLine, 5), before: props.followUpFrom !== null && dateEnd(e.end ?? e.start) < props.followUpFrom };
  });
  const rows: (typeof cards)[] = [];
  for (let i = 0; i < cards.length; i += cols) rows.push(cards.slice(i, i + cols));
  const LINE = 16;
  const HEAD = 46;
  const cardH = (c: (typeof cards)[number]) => 14 + (c.age ? LINE + 2 : 0) + c.title.length * LINE + (c.body.length ? 4 + c.body.length * LINE : 0) + 10;
  let y = M;
  const placed = rows.map((row) => {
    const top = y;
    const h = Math.max(...row.map(cardH));
    y += HEAD + h + 22;
    return { row, top, h };
  });
  const font = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  return (
    <svg className="essentiel" xmlns="http://www.w3.org/2000/svg" width={props.width} height={y} role="img" aria-label="L'essentiel du parcours" fontFamily={font}>
      <rect width={props.width} height={y} fill="#f8f9fb" />
      {placed.map(({ row, top, h }, r) => (
        <g key={r}>
          <line x1={M} x2={props.width - M} y1={top + 28} y2={top + 28} stroke="#3b82f6" strokeWidth={4} />
          {row.map((c, i) => {
            const x = M + i * (cardW + GAP);
            const cx = x + cardW / 2;
            const color = KIND_COLOR[track[c.e.trackId].kind];
            let ty = top + HEAD + 14;
            const line = (text: string, weight: number, fill: string) => {
              ty += LINE;
              return (
                <text key={ty} x={cx} y={ty - 4} textAnchor="middle" fontSize={12.5} fontWeight={weight} fill={fill}>
                  {text}
                </text>
              );
            };
            return (
              <g key={c.e.id} className="landmark" onClick={() => props.onPick(c.e)} style={{ cursor: "pointer" }}>
                <text x={cx} y={top + 16} textAnchor="middle" fontSize={15} fontWeight={700} fill="#1d2130">
                  {c.when}
                </text>
                <circle cx={cx} cy={top + 28} r={8} fill={color} stroke="#f8f9fb" strokeWidth={2} />
                <rect x={x} y={top + HEAD} width={cardW} height={h} rx={6} fill="#ffffff" stroke={c.before ? "#c9cede" : "#e2e5ee"} strokeDasharray={c.before ? "4 3" : undefined} />
                {c.age && line(c.age, 700, "#4a5068")}
                {c.title.map((s) => line(s, 600, color))}
                {c.body.map((s) => line(s, 400, "#4a5068"))}
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

/** The picture as shown, as a PNG file (twice the screen size, for slides). */
export function downloadSvgAsPng(svg: SVGSVGElement, filename: string): void {
  const xml = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  const [w, h] = [svg.width.baseVal.value, svg.height.baseVal.value];
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = w * 2;
    canvas.height = h * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
}
