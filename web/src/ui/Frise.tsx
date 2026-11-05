import { useEffect, useMemo, useRef, useState } from "react";

import { friseHtml } from "../app/exportFrise";
import { reidentifyTimeline, type KeyTable } from "../core/reidentify";
import { formatAge } from "../notebook/age";
import {
  dateEnd,
  dateStart,
  TRACK_KIND_LABEL,
  TRACK_KINDS,
  type Observation,
  type Timeline,
  type TimelineEvent,
  type TrackKind,
  withUndated,
} from "../notebook/model";

const LABEL_W = 168;
const ROW_H = 26;
const HEAD_H = 24;
const AXIS_H = 28;
const PAD_R = 16;

const MODE_LABEL: Record<string, string> = {
  usage: "usage",
  intoxication: "intoxication",
  sevrage: "sevrage",
  rechute: "rechute",
  craving: "craving",
};

function formatDate(s: string): string {
  const [y, m, d] = s.split("-");
  if (d) return `${d}/${m}/${y}`;
  if (m) return `${m}/${y}`;
  return y;
}

/** "d'après l'âge : 14 ans", for a bound computed from an age. */
function ageNote(e: TimelineEvent): string | null {
  if (!e.fromAge) return null;
  const { start, end } = e.fromAge;
  if (start && end) return `d'après l'âge : ${formatAge(start)} → ${formatAge(end)}`;
  if (start) return `d'après l'âge : ${formatAge(start)}`;
  return end ? `fin d'après l'âge : ${formatAge(end)}` : null;
}

function ticks(min: number, max: number): { t: number; label: string; major: boolean }[] {
  const out: { t: number; label: string; major: boolean }[] = [];
  const y0 = new Date(min).getUTCFullYear();
  const y1 = new Date(max).getUTCFullYear();
  const years = y1 - y0 + 1;
  const monthStep = years <= 1 ? 1 : years <= 3 ? 3 : 0;
  for (let y = y0; y <= y1 + 1; y++) {
    for (let m = 0; m < 12; m += monthStep || 12) {
      const t = Date.UTC(y, m, 1);
      if (t < min || t > max) continue;
      out.push({ t, label: m === 0 ? String(y) : `${String(m + 1).padStart(2, "0")}/${String(y).slice(2)}`, major: m === 0 });
    }
  }
  // Too many year ticks on long histories: keep every 2nd or 5th year.
  if (!monthStep && out.length > 14) {
    const step = out.length > 40 ? 5 : 2;
    return out.filter((x) => new Date(x.t).getUTCFullYear() % step === 0);
  }
  return out;
}

export function Frise(props: {
  timeline: Timeline;
  observations: Observation[];
  /** Label -> real value, from this session's detections (never sent). */
  keyTable?: KeyTable;
  /** `real`: open the original page rather than the pseudonymized one. */
  onOpenSource?: (observationId: string, real: boolean) => void;
  /** Save the analysis (pseudonymized) to reopen it later. */
  onSave?: () => void;
  /** Reopened analysis without its table: load the .axkey. */
  onImportKey?: (files: File[]) => void;
  /** Where the analysis came from, e.g. "Claude Sonnet 5.5, réponses rejouées". */
  source?: string;
}) {
  const hasKey = (props.keyTable?.size ?? 0) > 0;
  const [names, setNames] = useState<"real" | "pseudo">(hasKey ? "real" : "pseudo");
  const real = hasKey && names === "real";
  const timeline = useMemo(
    () => (real ? reidentifyTimeline(props.timeline, props.keyTable!) : withUndated(props.timeline)),
    [real, props.timeline, props.keyTable],
  );
  const openSource = (id: string) => props.onOpenSource?.(id, real);
  const wrap = useRef<HTMLDivElement>(null);
  const chart = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const [mode, setMode] = useState<"chart" | "table">("chart");
  const [hover, setHover] = useState<{ e: TimelineEvent; x: number; y: number } | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(480, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const lastObservation = useMemo(
    () => props.observations.map((o) => o.date).filter(Boolean).sort().at(-1) as string | undefined,
    [props.observations],
  );

  /** First and last observation dates: the follow-up period. */
  const followUp = useMemo(() => {
    const dates = props.observations.map((o) => o.date).filter((d): d is string => Boolean(d)).sort();
    return dates.length ? { from: dateStart(dates[0]), to: dateEnd(dates.at(-1)!) } : null;
  }, [props.observations]);

  const whole = useMemo(() => {
    const starts = timeline.events.map((e) => dateStart(e.start));
    const ends = timeline.events.map((e) => dateEnd(e.end ?? e.start));
    if (lastObservation) ends.push(dateEnd(lastObservation));
    return { lo: Math.min(...starts), hi: Math.max(...ends) };
  }, [timeline, lastObservation]);

  // A life-long history (antecedents from childhood) squeezes a year of
  // follow-up into a sliver: then the frise opens on the follow-up period.
  const longHistory = followUp !== null && whole.lo < followUp.from && whole.hi - whole.lo > 3 * Math.max(followUp.to - followUp.from, 180 * 864e5);
  const [span, setSpan] = useState<"followup" | "all">(longHistory ? "followup" : "all");
  const zoomed = span === "followup" && longHistory;

  const { min, max } = useMemo(() => {
    const lo = zoomed ? followUp!.from : whole.lo;
    const hi = zoomed ? Math.max(followUp!.to, ...timeline.events.filter((e) => dateStart(e.start) >= followUp!.from).map((e) => dateEnd(e.end ?? e.start))) : whole.hi;
    const pad = Math.max((hi - lo) * 0.03, 15 * 864e5);
    return { min: lo - pad, max: hi + pad };
  }, [timeline, whole, followUp, zoomed]);

  const plotW = width - LABEL_W - PAD_R;
  // Before the window (follow-up view), marks are pinned to its left edge.
  const x = (t: number) => LABEL_W + ((Math.max(t, min) - min) / (max - min)) * plotW;

  // Layout: one section per kind that has tracks, one row per track (tracks
  // holding only undated antecedents are listed below the frise instead).
  const datedTracks = new Set(timeline.events.map((e) => e.trackId));
  const rows: ({ type: "head"; kind: TrackKind } | { type: "track"; trackId: string; label: string; kind: TrackKind })[] = [];
  for (const kind of TRACK_KINDS) {
    const tracks = timeline.tracks.filter((t) => t.kind === kind && datedTracks.has(t.id));
    if (!tracks.length) continue;
    rows.push({ type: "head", kind });
    for (const t of tracks) rows.push({ type: "track", trackId: t.id, label: t.label, kind });
  }
  const rowY: Record<string, number> = {};
  let y = AXIS_H;
  for (const r of rows) {
    if (r.type === "track") rowY[r.trackId] = y;
    y += r.type === "head" ? HEAD_H : ROW_H;
  }
  const height = y + 8;
  const kindOf = Object.fromEntries(timeline.tracks.map((t) => [t.id, t.kind]));
  const trackLabel = Object.fromEntries(timeline.tracks.map((t) => [t.id, t.label]));

  const sortedEvents = [...timeline.events].sort((a, b) => a.start.localeCompare(b.start));

  const exportHtml = () => {
    const svg = chart.current?.querySelector("svg")?.outerHTML;
    if (!svg) return;
    if (real && !window.confirm("Cette page contiendra les vrais noms du patient et des soignants. L'enregistrer sur ce poste ?")) return;
    const html = friseHtml({
      title: "Frise chronologique",
      meta: `${timeline.events.length} événements · exportée le ${new Date().toLocaleDateString("fr-FR")}${props.source ? ` · ${props.source}` : ""}`,
      identifying: real,
      svg,
      rows: sortedEvents.map((e) => ({
        date: `${formatDate(e.start)}${e.end ? ` → ${formatDate(e.end)}` : e.ongoing ? " → en cours" : ""}`,
        kind: TRACK_KIND_LABEL[kindOf[e.trackId] as TrackKind],
        color: `var(--kind-${kindOf[e.trackId]})`,
        track: trackLabel[e.trackId],
        note: [e.mode ? MODE_LABEL[e.mode] : "", e.lossOfControl ? "(perte de contrôle)" : "", e.note].filter(Boolean).join(" "),
      })),
    });
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = real ? "frise-IDENTIFIANTE.html" : "frise-pseudonymisee.html";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section className="frise viz-root">
      <div className="viewer-toolbar">
        <div className="doc-title">Frise chronologique</div>
        <span className="muted small">
          {timeline.events.length} événements · {datedTracks.size} pistes
          {timeline.undated.length > 0 && ` · ${timeline.undated.length} non datés`}
        </span>
        {longHistory && mode === "chart" && (
          <div className="segmented" role="group" aria-label="Période affichée">
            <button aria-pressed={zoomed} onClick={() => setSpan("followup")} title="Du premier au dernier document">
              Période de suivi
            </button>
            <button aria-pressed={!zoomed} onClick={() => setSpan("all")} title="Antécédents compris, depuis l'enfance">
              Toute l'histoire
            </button>
          </div>
        )}
        <div className="segmented" role="tablist">
          <button role="tab" aria-selected={mode === "chart"} onClick={() => setMode("chart")}>
            Frise
          </button>
          <button role="tab" aria-selected={mode === "table"} onClick={() => setMode("table")}>
            Tableau
          </button>
        </div>
        {hasKey && (
          <div className="segmented names-toggle" role="group" aria-label="Affichage des identités">
            <button aria-pressed={real} onClick={() => setNames("real")} title="Remplace les étiquettes par les vraies valeurs, sur ce poste uniquement">
              Noms réels
            </button>
            <button aria-pressed={!real} onClick={() => setNames("pseudo")}>
              Pseudonymes
            </button>
          </div>
        )}
        <div className="frise-actions">
          {mode === "chart" && timeline.events.length > 0 && (
            <button className="small-btn" onClick={exportHtml} title={real ? "Page HTML avec les vrais noms (identifiante)" : "Page HTML pseudonymisée"}>
              Exporter la page
            </button>
          )}
          {props.onImportKey && !hasKey && (
            <label className="small-btn" title="Fichier .axkey exporté à la relecture, déchiffré sur ce poste">
              Remettre les vrais noms…
              <input type="file" accept=".axkey" hidden onChange={(e) => e.target.files && props.onImportKey!([...e.target.files])} />
            </label>
          )}
          {props.onSave && (
            <button className="small-btn" onClick={props.onSave} title="Fichier .json pseudonymisé, à rouvrir avec la table de correspondance">
              Enregistrer l'analyse
            </button>
          )}
        </div>
      </div>
      <PatientHeader keyTable={props.keyTable} real={real} observations={props.observations} />
      <div className={"frise-banner " + (real ? "real" : "pseudo")}>
        {real ? (
          <>
            <strong>Noms réels remis sur ce poste.</strong> Le modèle n'a vu que des étiquettes ([PATIENT], [SOIGNANT_2]…) ;
            la correspondance reste dans ce navigateur. Affichage identifiant : ne pas diffuser.
          </>
        ) : (
          <>
            <strong>Vue pseudonymisée</strong> : exactement ce que le modèle a lu et rendu.
            {props.source && ` ${props.source}.`}
          </>
        )}
        {real && props.source && <span className="muted"> {props.source}.</span>}
      </div>

      <div className="frise-body" ref={wrap}>
        {timeline.events.length === 0 && <p className="muted center-text">Aucun événement daté n'a été trouvé.</p>}

        {mode === "chart" && timeline.events.length > 0 && (
          <div className="frise-chart" ref={chart} onMouseLeave={() => setHover(null)}>
            <svg width={width} height={height} role="img" aria-label="Frise chronologique du parcours de soins">
              {ticks(min, max).map((tk) => (
                <g key={tk.t}>
                  <line x1={x(tk.t)} x2={x(tk.t)} y1={AXIS_H - 6} y2={height} className={tk.major ? "grid major" : "grid"} />
                  <text x={x(tk.t) + 3} y={AXIS_H - 10} className="axis-label">
                    {tk.label}
                  </text>
                </g>
              ))}
              {rows.map((r, i) => {
                const top = r.type === "track" ? rowY[r.trackId] : rows.slice(0, i).reduce((acc, rr) => acc + (rr.type === "head" ? HEAD_H : ROW_H), AXIS_H);
                return r.type === "head" ? (
                  <g key={`h-${r.kind}`}>
                    <rect x={8} y={top + 8} width={10} height={10} rx={3} style={{ fill: `var(--kind-${r.kind})` }} />
                    <text x={24} y={top + 17} className="lane-head">
                      {TRACK_KIND_LABEL[r.kind]}
                    </text>
                  </g>
                ) : (
                  <g key={r.trackId}>
                    <line x1={LABEL_W} x2={width - PAD_R} y1={top + ROW_H / 2} y2={top + ROW_H / 2} className="lane-line" />
                    <text x={24} y={top + ROW_H / 2 + 4} className="lane-label">
                      {r.label.length > 22 ? r.label.slice(0, 21) + "…" : r.label}
                      <title>{r.label}</title>
                    </text>
                  </g>
                );
              })}
              {timeline.events.map((e) => {
                const kind = kindOf[e.trackId];
                const cy = rowY[e.trackId] + ROW_H / 2;
                const x0 = x(dateStart(e.start));
                const endT = e.end ? dateEnd(e.end) : e.ongoing && lastObservation ? dateEnd(lastObservation) : null;
                const fill = { fill: `var(--kind-${kind})`, ...(e.fromAge ? { stroke: `var(--kind-${kind})` } : {}) };
                const early = zoomed && !e.ongoing && dateEnd(e.end ?? e.start) < min ? " early" : "";
                const approx = (e.fromAge ? " approx" : "") + early;
                const handlers = {
                  onMouseEnter: (ev: React.MouseEvent) =>
                    setHover({ e, x: ev.clientX - (chart.current?.getBoundingClientRect().left ?? 0), y: cy }),
                  onClick: () => openSource(e.observationIds[0]),
                  tabIndex: 0,
                  onKeyDown: (ev: React.KeyboardEvent) => ev.key === "Enter" && openSource(e.observationIds[0]),
                  onFocus: () => setHover({ e, x: x0, y: cy }),
                };
                return (
                  <g key={e.id} className="event" {...handlers}>
                    {endT !== null ? (
                      <>
                        <rect
                          x={x0}
                          y={cy - 5}
                          width={Math.max(6, x(endT) - x0)}
                          height={10}
                          rx={4}
                          style={fill}
                          className={(e.mode === "craving" ? "mark craving" : "mark") + approx}
                        />
                        {e.ongoing && <path d={`M${x(endT)} ${cy - 6} l7 6 l-7 6 z`} style={fill} className="mark" />}
                      </>
                    ) : (
                      <circle cx={x0} cy={cy} r={5} style={fill} className={"mark point" + approx} />
                    )}
                    {e.lossOfControl && <path d={`M${x0} ${cy - 13} l4 5 l-4 5 l-4 -5 z`} className="loss-marker" />}
                    <rect x={x0 - 8} y={cy - 12} width={Math.max(16, (endT ? x(endT) - x0 : 0) + 16)} height={24} className="hit" />
                  </g>
                );
              })}
            </svg>
            {hover && (
              <div className="tooltip" style={{ left: Math.min(hover.x + 12, width - 260), top: hover.y + 14 }} role="tooltip">
                <strong>
                  {trackLabel[hover.e.trackId]}
                  {hover.e.mode ? ` · ${MODE_LABEL[hover.e.mode]}` : ""}
                </strong>
                <span className="muted small">
                  {formatDate(hover.e.start)}
                  {hover.e.end ? ` → ${formatDate(hover.e.end)}` : hover.e.ongoing ? " → en cours" : ""}
                  {hover.e.lossOfControl ? " · perte de contrôle" : ""}
                </span>
                {ageNote(hover.e) && <span className="muted small">{ageNote(hover.e)}</span>}
                {hover.e.note && <span>{hover.e.note}</span>}
                <span className="muted small">Cliquer pour ouvrir la source</span>
              </div>
            )}
            <p className="legend-note small muted">
              ▬ période · ● événement ponctuel · ▸ toujours en cours · ◆ perte de contrôle · teinte pâle : craving · contour
              pointillé : date calculée d'après l'âge
            </p>
          </div>
        )}

        {mode === "table" && (
          <table className="event-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Piste</th>
                <th>Événement</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((e) => (
                <tr key={e.id}>
                  <td className="nowrap">
                    {formatDate(e.start)}
                    {e.end ? ` → ${formatDate(e.end)}` : e.ongoing ? " → en cours" : ""}
                    {ageNote(e) && <div className="muted small">{ageNote(e)}</div>}
                  </td>
                  <td>
                    <span className="swatch" style={{ background: `var(--kind-${kindOf[e.trackId]})` }} />
                    {TRACK_KIND_LABEL[kindOf[e.trackId] as TrackKind]} · {trackLabel[e.trackId]}
                  </td>
                  <td>
                    {e.mode ? <em>{MODE_LABEL[e.mode]} </em> : null}
                    {e.lossOfControl ? <em>(perte de contrôle) </em> : null}
                    {e.note}
                  </td>
                  <td>
                    {e.observationIds.map((id) => (
                      <button key={id} className="link" onClick={() => openSource(id)}>
                        {props.observations.find((o) => o.id === id)?.date ?? "voir"}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {timeline.undated.length > 0 && (
          <section className="undated" aria-label="Antécédents non datés">
            <h3>Antécédents non datés</h3>
            <p className="muted small">
              Racontés par l'âge, sans date de naissance connue ou au-delà de la dernière observation : ils ne sont pas
              placés sur la frise.
            </p>
            <ul>
              {timeline.undated.map((u) => (
                <li key={u.id}>
                  <span className="swatch" style={{ background: `var(--kind-${kindOf[u.trackId]})` }} />
                  <strong>{trackLabel[u.trackId]}</strong>
                  {u.mode ? <em> · {MODE_LABEL[u.mode]}</em> : null}
                  <span className="muted">
                    {" "}
                    · {formatAge(u.startAge)}
                    {u.endAge ? ` → ${formatAge(u.endAge)}` : u.ongoing ? " → en cours" : ""}
                  </span>
                  {u.note ? ` — ${u.note}` : ""}{" "}
                  {u.observationIds.map((id) => (
                    <button key={id} className="link" onClick={() => openSource(id)}>
                      {props.observations.find((o) => o.id === id)?.date ?? "voir"}
                    </button>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </section>
  );
}

/** Who the frise is about: labels, or the real values from the local table. */
function PatientHeader(props: { keyTable?: KeyTable; real: boolean; observations: Observation[] }) {
  const birthLabel = props.keyTable && [...props.keyTable.keys()].find((k) => /^\[NE\(E\) EN \d{4}\]$/.test(k));
  const show = (label: string) => (props.real ? props.keyTable?.get(label) ?? label : label);
  const dates = props.observations.map((o) => o.date).filter((d): d is string => Boolean(d)).sort();
  const docs = new Set(props.observations.map((o) => o.doc)).size;
  return (
    <div className={"patient-header" + (props.real ? " real" : "")}>
      <span className="patient-avatar" aria-hidden>
        {props.real ? "●" : "?"}
      </span>
      <div className="patient-id">
        <strong>{show("[PATIENT]")}</strong>
        {birthLabel && <span>{props.real ? `né(e) le ${show(birthLabel)}` : birthLabel}</span>}
      </div>
      <div className="patient-facts">
        {dates.length > 0 && (
          <span>
            Suivi du {formatDate(dates[0])} au {formatDate(dates.at(-1)!)}
          </span>
        )}
        <span>
          {props.observations.length} observations · {docs} document{docs > 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
