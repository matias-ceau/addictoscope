import { useEffect, useMemo, useRef, useState } from "react";

import { friseHtml } from "../app/exportFrise";
import { reidentifyTimeline, type KeyTable } from "../core/reidentify";
import { formatAge } from "../notebook/age";
import { correctionCount, keyEvents, setVerdict } from "../notebook/edit";
import {
  dateEnd,
  dateStart,
  TRACK_KIND_LABEL,
  TRACK_KINDS,
  tellingsDisagree,
  type Observation,
  type Timeline,
  type TimelineEvent,
  type Track,
  type TrackKind,
  withUndated,
} from "../notebook/model";
import { linearScale, splitScale, ticks } from "./axis";
import { downloadSvgAsPng, Essentiel, EventEditor, formatDate, type EditTarget } from "./FriseEdit";

const LABEL_W = 168;
const ROW_H = 26;
const HEAD_H = 24;
const PAD_R = 16;

const MODE_LABEL: Record<string, string> = {
  usage: "usage",
  intoxication: "intoxication",
  sevrage: "sevrage",
  rechute: "rechute",
  craving: "craving",
};

/** "d'après l'âge : 14 ans", for a bound computed from an age. */
function ageNote(e: TimelineEvent): string | null {
  if (!e.fromAge) return null;
  const { start, end } = e.fromAge;
  if (start && end) return `d'après l'âge : ${formatAge(start)} → ${formatAge(end)}`;
  if (start) return `d'après l'âge : ${formatAge(start)}`;
  return end ? `fin d'après l'âge : ${formatAge(end)}` : null;
}

/** Where an event's dates come from, when it is not simply the date written. */
/** A track's label, with the other labels its regrouped tracks were read under. */
export function trackTitle(t: Track): string {
  return t.aliases?.length ? `${t.label} (aussi lu : ${t.aliases.join(" · ")})` : t.label;
}

export function dateNotes(e: TimelineEvent): string[] {
  const notes: string[] = [];
  const age = ageNote(e);
  if (age) notes.push(age);
  if (e.startUnknown) notes.push("début non précisé dans le texte");
  if (e.tellings && tellingsDisagree(e.tellings)) {
    const starts = [...new Set(e.tellings.flatMap((t) => (t.start ? [t.start] : [])))].sort();
    notes.push(`dates discordantes selon les observations : ${starts.map(formatDate).join(" · ")}`);
  } else if (e.tellings) notes.push(`${e.tellings.length} mentions regroupées`);
  return notes;
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
  /** The pseudonymized text of an observation, for an event's card. */
  sourceText?: (observationId: string) => string | null;
  /** Corrections by hand: the pseudonymized frise, changed. Absent: read only. */
  onChange?: (timeline: Timeline) => void;
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
  const [mode, setMode] = useState<"chart" | "short" | "table">("chart");
  /** The frise as saved, under its labels: what corrections are written to. */
  const base = useMemo(() => withUndated(props.timeline), [props.timeline]);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  /** The frise over the whole window: side panels leave it little room. */
  const [full, setFull] = useState(false);
  const corrections = correctionCount(base);
  const verdict = (id: string, v: TimelineEvent["verdict"]) => props.onChange?.(setVerdict(base, id, base.events.find((e) => e.id === id)?.verdict === v ? undefined : v));
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
  // follow-up into a sliver. The frise still opens on the whole course —
  // what came before follow-up is half of the story — on an axis in two
  // parts, each with its own scale; the follow-up alone is one click away.
  const longHistory = followUp !== null && whole.lo < followUp.from && whole.hi - whole.lo > 3 * Math.max(followUp.to - followUp.from, 180 * 864e5);
  const [span, setSpan] = useState<"followup" | "all">("all");
  const zoomed = span === "followup" && longHistory;
  const split = longHistory && !zoomed;
  const AXIS_H = split ? 44 : 28;

  const { min, max } = useMemo(() => {
    const lo = zoomed ? followUp!.from : whole.lo;
    const hi = zoomed ? Math.max(followUp!.to, ...timeline.events.filter((e) => dateStart(e.start) >= followUp!.from).map((e) => dateEnd(e.end ?? e.start))) : whole.hi;
    const pad = Math.max((hi - lo) * 0.03, 15 * 864e5);
    return { min: lo - pad, max: hi + pad };
  }, [timeline, whole, followUp, zoomed]);

  const plotW = width - LABEL_W - PAD_R;
  // Before the window (follow-up view), marks are pinned to its left edge.
  const scale = split ? splitScale(min, followUp!.from, max) : linearScale(min, max);
  const x = (t: number) => LABEL_W + scale(t) * plotW;
  const cut = scale.breakAt;
  const axisTicks = cut
    ? [...ticks(min, cut.t - 1, Math.max(2, Math.floor((cut.at * plotW) / 44))), ...ticks(cut.t, max, Math.max(3, Math.floor(((1 - cut.at) * plotW) / 48)))]
    : ticks(min, max, Math.max(4, Math.floor(plotW / 55)));
  const birthYear = useMemo(() => {
    const label = [...(props.keyTable?.keys() ?? [])].find((k) => /^\[NE\(E\) EN \d{4}\]$/.test(k));
    return label ? Number(/\d{4}/.exec(label)![0]) : null;
  }, [props.keyTable]);
  const landmarks = useMemo(() => keyEvents(timeline, followUp?.from ?? null), [timeline, followUp]);

  // Layout: one section per kind that has tracks, one row per track (tracks
  // holding only undated antecedents are listed below the frise instead).
  const datedTracks = new Set(timeline.events.map((e) => e.trackId));
  const rows: ({ type: "head"; kind: TrackKind } | { type: "track"; trackId: string; label: string; title: string; kind: TrackKind })[] = [];
  for (const kind of TRACK_KINDS) {
    const tracks = timeline.tracks.filter((t) => t.kind === kind && datedTracks.has(t.id));
    if (!tracks.length) continue;
    rows.push({ type: "head", kind });
    for (const t of tracks) rows.push({ type: "track", trackId: t.id, label: t.label, title: trackTitle(t), kind });
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
    <section className={"frise viz-root" + (full ? " full" : "")}>
      <div className="viewer-toolbar">
        <div className="doc-title">Frise chronologique</div>
        <span className="muted small">
          {timeline.events.length} événements · {datedTracks.size} pistes
          {timeline.undated.length > 0 && ` · ${timeline.undated.length} non datés`}
          {corrections.total > 0 && (
            <strong className="hand-count" title="Événements ajoutés, modifiés ou supprimés à la main. Ils sont gardés dans ce navigateur et dans l'analyse enregistrée, et remis si le dossier est relu ou rouvert.">
              {` · ${corrections.total} correction${corrections.total > 1 ? "s" : ""} à la main`}
            </strong>
          )}
          {timeline.consensus && (
            <span title="Ce que toutes les lectures trouvent est gardé ; un modèle plus fort tranche le reste, en ne voyant que les observations concernées">
              {` · consensus de ${timeline.consensus.readers} lectures : ${timeline.consensus.agreed} accords, ${timeline.consensus.kept} gardés et ${timeline.consensus.dropped} écartés par l'arbitre`}
              {timeline.consensus.unarbitrated > 0 && `, ${timeline.consensus.unarbitrated} non arbitrés`}
            </span>
          )}
          {timeline.consolidation && !timeline.consolidation.failed && (
            <span title="Un dossier long est lu par lots indépendants et raconte plusieurs fois le même fait : un appel de plus, sans aucun texte d'observation, dit ce qui désigne la même chose. Chaque mention regroupée reste visible sur l'événement.">
              {` · lu en ${timeline.consolidation.lots} lots, doublons regroupés (${timeline.consolidation.eventsBefore} → ${timeline.consolidation.eventsAfter} événements`}
              {timeline.consolidation.discordant > 0 && `, ${timeline.consolidation.discordant} avec des dates discordantes`}
              {")"}
            </span>
          )}
          {timeline.proofreading && !timeline.proofreading.failed && (
            <span title="Chaque événement a été relu contre tout le texte par le modèle">
              {` · relue contre le texte (${timeline.proofreading.fixed} corrigés, ${timeline.proofreading.removed} retirés, ${timeline.proofreading.added} ajoutés)`}
            </span>
          )}
          {timeline.consolidation?.failed && (
            <span className="error-text" title={timeline.consolidation.failed}>
              {` · lu en ${timeline.consolidation.lots} lots, doublons non regroupés (l'appel a échoué)`}
            </span>
          )}
        </span>
        {longHistory && mode === "chart" && (
          <div className="segmented" role="group" aria-label="Période affichée">
            <button aria-pressed={!zoomed} onClick={() => setSpan("all")} title="Antécédents compris, depuis l'enfance : l'avant-suivi et le suivi ont chacun leur échelle">
              Parcours entier
            </button>
            <button aria-pressed={zoomed} onClick={() => setSpan("followup")} title="Du premier au dernier document">
              Suivi seul
            </button>
          </div>
        )}
        <div className="segmented" role="tablist">
          <button role="tab" aria-selected={mode === "chart"} onClick={() => setMode("chart")}>
            Frise
          </button>
          <button role="tab" aria-selected={mode === "short"} onClick={() => setMode("short")} title="Une dizaine de repères du parcours, à montrer ou à exporter en image">
            Essentiel
          </button>
          <button role="tab" aria-selected={mode === "table"} onClick={() => setMode("table")} title="Tous les événements en liste, à vérifier un par un">
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
          <button className="small-btn" aria-pressed={full} onClick={() => setFull((f) => !f)} title="La frise sur toute la fenêtre">
            {full ? "Réduire" : "Agrandir"}
          </button>
          {props.onChange && (
            <button className="small-btn" onClick={() => setEditing({ preset: { kind: "life_event", label: "" } })} title="Ajouter à la main un événement que la lecture n'a pas relevé">
              + Événement
            </button>
          )}
          {mode === "short" && landmarks.length > 0 && (
            <button
              className="small-btn"
              title="Image PNG de la vue « Essentiel », pour une présentation"
              onClick={() => {
                const svg = wrap.current?.querySelector<SVGSVGElement>("svg.essentiel");
                if (!svg) return;
                if (real && !window.confirm("Cette image peut contenir les vrais noms du patient et des soignants. L'enregistrer sur ce poste ?")) return;
                downloadSvgAsPng(svg, real ? "essentiel-IDENTIFIANT.png" : "essentiel-pseudonymise.png");
              }}
            >
              Exporter l'image
            </button>
          )}
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
              {cut && (
                <g className="history">
                  <rect x={LABEL_W} y={AXIS_H - 6} width={x(cut.t) - LABEL_W} height={height - AXIS_H + 6} className="history-band" />
                  <line x1={x(cut.t)} x2={x(cut.t)} y1={4} y2={height} className="history-cut" />
                  <text x={x(cut.t) - 6} y={13} textAnchor="end" className="history-label">
                    Avant le suivi
                  </text>
                  <text x={x(cut.t) + 6} y={13} className="history-label">
                    Suivi (premier document : {formatDate(props.observations.map((o) => o.date).filter(Boolean).sort()[0]!)})
                  </text>
                </g>
              )}
              {axisTicks.map((tk) => (
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
                      <title>{r.title}</title>
                    </text>
                    {props.onChange && (
                      <text
                        x={10}
                        y={top + ROW_H / 2 + 4}
                        className="lane-add"
                        role="button"
                        tabIndex={0}
                        onClick={() => setEditing({ preset: { kind: r.kind, label: base.tracks.find((t) => t.id === r.trackId)?.label ?? r.label } })}
                        onKeyDown={(ev) => ev.key === "Enter" && setEditing({ preset: { kind: r.kind, label: base.tracks.find((t) => t.id === r.trackId)?.label ?? r.label } })}
                      >
                        +<title>Ajouter un événement sur cette ligne</title>
                      </text>
                    )}
                  </g>
                );
              })}
              {timeline.events.map((e) => {
                const kind = kindOf[e.trackId];
                const cy = rowY[e.trackId] + ROW_H / 2;
                const x0 = x(dateStart(e.start));
                const endT = e.end ? dateEnd(e.end) : e.ongoing && lastObservation ? dateEnd(lastObservation) : null;
                const fill = { fill: `var(--kind-${kind})`, ...(e.fromAge || e.startUnknown ? { stroke: `var(--kind-${kind})` } : {}) };
                const early = zoomed && !e.ongoing && dateEnd(e.end ?? e.start) < min ? " early" : "";
                const approx = (e.fromAge || e.startUnknown ? " approx" : "") + early + (e.edited ? " edited" : "") + (e.verdict === "wrong" ? " wrong" : "");
                const handlers = {
                  onMouseEnter: (ev: React.MouseEvent) =>
                    setHover({ e, x: ev.clientX - (chart.current?.getBoundingClientRect().left ?? 0), y: cy }),
                  onClick: () => setEditing({ id: e.id }),
                  tabIndex: 0,
                  onKeyDown: (ev: React.KeyboardEvent) => ev.key === "Enter" && setEditing({ id: e.id }),
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
                {dateNotes(hover.e).map((n) => (
                  <span key={n} className="muted small">
                    {n}
                  </span>
                ))}
                {hover.e.note && <span>{hover.e.note}</span>}
                {hover.e.consensus === "arbitrated" && <span className="muted small">Désaccord entre les lectures, tranché par l'arbitre</span>}
                {hover.e.consensus === "unarbitrated" && <span className="muted small">Désaccord entre les lectures, non arbitré (gardé tel que lu)</span>}
                {hover.e.edited && <span className="muted small">{hover.e.edited === "added" ? "Ajouté à la main" : "Corrigé à la main"}</span>}
                <span className="muted small">{props.onChange ? "Cliquer pour voir la source ou corriger" : "Cliquer pour voir la source"}</span>
              </div>
            )}
            <p className="legend-note small muted">
              ▬ période · ● événement ponctuel · ▸ toujours en cours · ◆ perte de contrôle · teinte pâle : craving · contour
              pointillé : date calculée d'après l'âge, ou début non précisé · contour noir : corrigé à la main
            </p>
          </div>
        )}

        {mode === "short" && timeline.events.length > 0 && (
          <div className="essentiel-wrap">
            <Essentiel events={landmarks} timeline={timeline} birthYear={birthYear} followUpFrom={followUp?.from ?? null} width={width} onPick={(e) => setEditing({ id: e.id })} />
            <p className="legend-note small muted">
              {landmarks.length} repères choisis automatiquement (premiers usages, pertes de contrôle, événements de vie d'avant le suivi, premiers
              soins){birthYear ? "" : " ; âges affichés quand l'année de naissance est connue sur ce poste"}. Cadre pointillé : avant le suivi.
              {props.onChange && " Toucher un repère pour le corriger ou le retirer ; tout événement peut être ajouté depuis sa fiche."}
            </p>
          </div>
        )}

        {mode === "table" && props.onChange && timeline.events.length > 0 && (
          <p className="review-progress small">
            <strong>
              {corrections.verdicts} vérifié{corrections.verdicts > 1 ? "s" : ""} sur {timeline.events.length}
            </strong>{" "}
            <span className="muted">— pour chaque événement : juste, faux, ou à corriger. Rien ne quitte ce poste.</span>
          </p>
        )}
        {mode === "table" && (
          <table className={"event-table" + (props.onChange ? " reviewable" : "")}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Piste</th>
                <th>Événement</th>
                <th>Source</th>
                {props.onChange && <th>Vérification</th>}
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((e) => (
                <tr key={e.id} className={(e.verdict ? `verdict-${e.verdict}` : "") + (e.edited ? " edited" : "")}>
                  <td className="nowrap">
                    {formatDate(e.start)}
                    {e.end ? ` → ${formatDate(e.end)}` : e.ongoing ? " → en cours" : ""}
                    {dateNotes(e).map((n) => (
                      <div key={n} className="muted small">
                        {n}
                      </div>
                    ))}
                  </td>
                  <td>
                    <span className="swatch" style={{ background: `var(--kind-${kindOf[e.trackId]})` }} />
                    {TRACK_KIND_LABEL[kindOf[e.trackId] as TrackKind]} · {trackLabel[e.trackId]}
                  </td>
                  <td>
                    {e.mode ? <em>{MODE_LABEL[e.mode]} </em> : null}
                    {e.lossOfControl ? <em>(perte de contrôle) </em> : null}
                    {e.note}
                    {e.edited && <span className="chip chip-warn hand">{e.edited === "added" ? "ajouté à la main" : "corrigé à la main"}</span>}
                  </td>
                  <td>
                    {e.observationIds.map((id) => (
                      <button key={id} className="link" onClick={() => openSource(id)}>
                        {props.observations.find((o) => o.id === id)?.date ?? "voir"}
                      </button>
                    ))}
                  </td>
                  {props.onChange && (
                    <td className="verdicts">
                      <button aria-pressed={e.verdict === "ok"} className="verdict ok" onClick={() => verdict(e.id, "ok")}>
                        Juste
                      </button>
                      <button aria-pressed={e.verdict === "wrong"} className="verdict wrong" onClick={() => verdict(e.id, "wrong")}>
                        Faux
                      </button>
                      <button aria-pressed={Boolean(e.edited)} className="verdict fix" onClick={() => setEditing({ id: e.id })}>
                        Corriger
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {mode === "table" && props.onChange && (
          <label className="missing">
            <strong>Il manque…</strong>
            <span className="muted small">Ce que la frise aurait dû contenir, avec vos mots ; ou ajoutez-le avec « + Événement ».</span>
            <textarea rows={3} value={base.missing ?? ""} placeholder="Par exemple : hospitalisation de 2021 non relevée" onChange={(ev) => props.onChange!({ ...base, missing: ev.target.value })} />
          </label>
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
      {editing && (
        <EventEditor
          timeline={base}
          target={editing}
          observations={props.observations}
          real={real}
          onOpenSource={props.onOpenSource ? openSource : undefined}
          sourceText={props.sourceText}
          onChange={props.onChange}
          onClose={() => setEditing(null)}
        />
      )}
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
