import { useEffect, useMemo, useRef, useState } from "react";

import {
  dateEnd,
  dateStart,
  TRACK_KIND_LABEL,
  TRACK_KINDS,
  type Observation,
  type Timeline,
  type TimelineEvent,
  type TrackKind,
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
  onOpenSource: (observationId: string) => void;
}) {
  const { timeline } = props;
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

  const { min, max } = useMemo(() => {
    const starts = timeline.events.map((e) => dateStart(e.start));
    const ends = timeline.events.map((e) => dateEnd(e.end ?? e.start));
    if (lastObservation) ends.push(dateEnd(lastObservation));
    const lo = Math.min(...starts);
    const hi = Math.max(...ends);
    const pad = Math.max((hi - lo) * 0.03, 15 * 864e5);
    return { min: lo - pad, max: hi + pad };
  }, [timeline, lastObservation]);

  const plotW = width - LABEL_W - PAD_R;
  const x = (t: number) => LABEL_W + ((t - min) / (max - min)) * plotW;

  // Layout: one section per kind that has tracks, one row per track.
  const rows: ({ type: "head"; kind: TrackKind } | { type: "track"; trackId: string; label: string; kind: TrackKind })[] = [];
  for (const kind of TRACK_KINDS) {
    const tracks = timeline.tracks.filter((t) => t.kind === kind);
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

  return (
    <section className="frise viz-root">
      <div className="viewer-toolbar">
        <div className="doc-title">Frise chronologique</div>
        <span className="muted small">
          {timeline.events.length} événements · {timeline.tracks.length} pistes
        </span>
        <div className="segmented" role="tablist">
          <button role="tab" aria-selected={mode === "chart"} onClick={() => setMode("chart")}>
            Frise
          </button>
          <button role="tab" aria-selected={mode === "table"} onClick={() => setMode("table")}>
            Tableau
          </button>
        </div>
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
                const fill = { fill: `var(--kind-${kind})` };
                const handlers = {
                  onMouseEnter: (ev: React.MouseEvent) =>
                    setHover({ e, x: ev.clientX - (chart.current?.getBoundingClientRect().left ?? 0), y: cy }),
                  onClick: () => props.onOpenSource(e.observationIds[0]),
                  tabIndex: 0,
                  onKeyDown: (ev: React.KeyboardEvent) => ev.key === "Enter" && props.onOpenSource(e.observationIds[0]),
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
                          className={e.mode === "craving" ? "mark craving" : "mark"}
                        />
                        {e.ongoing && <path d={`M${x(endT)} ${cy - 6} l7 6 l-7 6 z`} style={fill} className="mark" />}
                      </>
                    ) : (
                      <circle cx={x0} cy={cy} r={5} style={fill} className="mark point" />
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
                {hover.e.note && <span>{hover.e.note}</span>}
                <span className="muted small">Cliquer pour ouvrir la source</span>
              </div>
            )}
            <p className="legend-note small muted">
              ▬ période · ● événement ponctuel · ▸ toujours en cours · ◆ perte de contrôle · teinte pâle : craving
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
                      <button key={id} className="link" onClick={() => props.onOpenSource(id)}>
                        {props.observations.find((o) => o.id === id)?.date ?? "voir"}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
