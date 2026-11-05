/**
 * The frise as a standalone HTML page: the chart as drawn on screen, the
 * events as a table, and a banner saying whether it identifies the patient.
 */

export interface ExportRow {
  date: string;
  kind: string;
  /** CSS colour variable of the kind, e.g. "var(--kind-substance_use)". */
  color: string;
  track: string;
  note: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CSS = `
:root { --line: #e2e5ee; --muted: #646b80; --text: #1d2130; --viz-surface: #fff;
  --kind-substance_use: #2a78d6; --kind-psychiatric: #eb6834; --kind-somatic: #1baf7a;
  --kind-medication: #eda100; --kind-therapeutic_psycho: #e87ba4; --kind-life_event: #008300; }
body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: var(--text); margin: 24px auto; max-width: 1200px; padding: 0 16px; }
h1 { font-size: 1.4rem; margin: 0 0 4px; }
.meta { color: var(--muted); font-size: 0.85rem; margin: 0 0 12px; }
.banner { padding: 10px 14px; border-radius: 10px; font-size: 0.9rem; margin-bottom: 16px; }
.banner.pseudo { background: #f0f2f7; }
.banner.real { background: #fdecea; color: #8a1c12; font-weight: 600; }
svg { display: block; max-width: 100%; height: auto; }
.grid { stroke: var(--line); stroke-width: 1; } .axis-label { fill: var(--muted); font-size: 11px; }
.lane-head { fill: var(--text); font-size: 12px; font-weight: 700; } .lane-label { fill: var(--muted); font-size: 12px; }
.lane-line { stroke: var(--line); stroke-width: 1; stroke-dasharray: 2 4; }
.mark { stroke: var(--viz-surface); stroke-width: 2; paint-order: stroke; } .mark.craving { fill-opacity: 0.45; }
.mark.approx { fill-opacity: 0.35; stroke-width: 1.5; stroke-dasharray: 4 3; } .mark.early { opacity: 0.35; }
.loss-marker { fill: var(--text); stroke: var(--viz-surface); stroke-width: 1.5; } .hit { fill: transparent; }
table { width: 100%; border-collapse: collapse; font-size: 0.86rem; margin-top: 20px; }
th { text-align: left; font-size: 0.76rem; text-transform: uppercase; color: var(--muted); padding: 8px; border-bottom: 1px solid var(--line); }
td { padding: 7px 8px; border-bottom: 1px solid var(--line); vertical-align: top; } td.nowrap { white-space: nowrap; }
.swatch { display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-right: 6px; }
`;

export function friseHtml(p: { title: string; meta: string; identifying: boolean; svg: string; rows: ExportRow[] }): string {
  const banner = p.identifying
    ? "Contient des données identifiantes (vrais noms remis localement) : ne pas diffuser."
    : "Pseudonymisé : les personnes apparaissent sous forme d'étiquettes ([PATIENT], [SOIGNANT_2]…).";
  const rows = p.rows
    .map(
      (r) =>
        `<tr><td class="nowrap">${esc(r.date)}</td><td><span class="swatch" style="background:${esc(r.color)}"></span>${esc(r.kind)} · ${esc(r.track)}</td><td>${esc(r.note)}</td></tr>`,
    )
    .join("\n");
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title><style>${CSS}</style></head>
<body>
<h1>${esc(p.title)}</h1>
<p class="meta">${esc(p.meta)}</p>
<div class="banner ${p.identifying ? "real" : "pseudo"}">${esc(banner)}</div>
${p.svg}
<table><thead><tr><th>Date</th><th>Piste</th><th>Événement</th></tr></thead><tbody>
${rows}
</tbody></table>
</body></html>
`;
}
