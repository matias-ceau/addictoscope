"""Render a frise as one self-contained interactive HTML page.

Reads either the expected frise of a fictional dossier (``verite.json``, key
``timeline``) or a frise produced by the app (``web/scripts/run-frise.ts``
output, keys ``timeline`` + ``observations``) and writes a single HTML file:
inline SVG and JavaScript, no network, works on a phone.

Design (after the hand-made frises of clinical case presentations):

- one colour family per kind of track (consumption, care, life, ...);
- phases of a same track are bars in a row; the mode of use (usage,
  intoxication, rechute...) is the shade, darker = more severe;
- life events without a duration sit on the axis itself;
- a lightning bolt marks a loss of control, when the event says so;
- overview strip with a draggable window, plus presets, as a zoom;
- tap or hover a bar to read its note, then the full observation(s) it comes
  from, with the sentences that justify it highlighted.

Usage (from ``addictoscope/``)::

    uv run python scripts/render_frise.py data/anonymized/dossiers/opiaces-tso/verite.json \
        -o data/processed/frise/interactive/opiaces-tso.html

For an app run, ``--notes`` points at the fictional dossier the run was made
on: each observation then shows the full note it was cut from (identities
masked), instead of the model's one-line summary::

    uv run python scripts/render_frise.py data/processed/frise/run1/opiaces-tso.json \
        --notes data/anonymized/dossiers/opiaces-tso -o data/processed/frise/interactive/opiaces-tso.html

Only dates, labels, notes and source names of the input frise end up in the
page; patient headers of the dossier are never read.

Antecedents dated from an age (``fromAge``) are drawn as approximate; those
the app could not place (``timeline.undated``) are listed under the frise
with their age.

A real dossier, on the private side only: ``--key <table.json>`` (shape
``{"labels": {"[PATIENT]": "..."}}``) puts the real values back in place of
the labels in all the text of the page, and ``--banner real`` replaces the
"synthetic data" banner (it is implied by ``--key``)::

    uv run python scripts/render_frise.py <run>.json --key <slug>.key.json -o <slug>.reel.html
"""
from __future__ import annotations

import argparse
import calendar
import html
import json
import re
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))
from addictoscope.frise_eval import _CANON, GENERIC, STOPWORDS, fold, label_tokens  # noqa: E402

KIND_ORDER = ["life_event", "substance_use", "psychiatric", "somatic", "medication", "therapeutic_psycho"]
KIND_LABEL = {
    "life_event": "Événements de vie",
    "substance_use": "Consommations",
    "psychiatric": "Psychopathologie",
    "somatic": "Somatique",
    "medication": "Médicaments",
    "therapeutic_psycho": "Prises en charge",
}
# (light theme, dark theme)
KIND_COLOR = {
    "life_event": ("#b45309", "#f59e0b"),
    "substance_use": ("#c62828", "#ef6b6b"),
    "psychiatric": ("#6a4bb0", "#a78bfa"),
    "somatic": ("#0f7b6c", "#34d3b9"),
    "medication": ("#1d5fb4", "#6aa6f0"),
    "therapeutic_psycho": ("#4d7c0f", "#a3d95b"),
}
MODE_LABEL = {
    "usage": "usage",
    "intoxication": "intoxication",
    "sevrage": "sevrage",
    "rechute": "rechute",
    "craving": "craving",
}
CERTAINTY_LABEL = {"exact": "date exacte", "month": "mois", "year": "année", "approx": "date approximative"}
BANNERS = {
    "synthetic": "Données synthétiques (dossier entièrement inventé)",
    "real": "Dossier réel pseudonymisé (usage privé, ne pas diffuser)",
    "reidentified": "Dossier réel ré-identifié (usage privé, ne pas diffuser)",
}


def format_age(age: list[int] | None) -> str:
    """[14, 14] -> "14 ans"; [12, 17] -> "entre 12 et 17 ans" (as the app)."""
    if not age:
        return ""
    a, b = age[0], age[-1]
    return f"{a} ans" if a == b else f"entre {a} et {b} ans"


def age_note(from_age: dict | None) -> str | None:
    """"d'après l'âge : 14 ans" for an event whose dates were computed from an age."""
    if not from_age:
        return None
    start, end = from_age.get("start"), from_age.get("end")
    if start and end:
        return f"d'après l'âge : {format_age(start)} → {format_age(end)}"
    if start:
        return f"d'après l'âge : {format_age(start)}"
    return f"fin d'après l'âge : {format_age(end)}" if end else None


def load_key(path: Path) -> dict[str, str]:
    """Correspondence table ``{"labels": {"[PATIENT]": "..."}}`` -> label -> value."""
    raw = json.loads(path.read_text(encoding="utf-8"))
    labels = raw.get("labels", raw)
    return {str(k): str(v) for k, v in labels.items() if k and v}


def reidentifier(labels: dict[str, str]):
    """Replace every known label in a text (longest first); unknown labels stay."""
    if not labels:
        return lambda text: text
    rx = re.compile("|".join(re.escape(k) for k in sorted(labels, key=len, reverse=True)))
    return lambda text: rx.sub(lambda m: labels[m.group()], text) if isinstance(text, str) else text


def reidentify(data: dict, labels: dict[str, str]) -> dict:
    """Put the real values back in all the text of a loaded frise (before ``prepare``)."""
    sub = reidentifier(labels)
    for t in data["tracks"]:
        t["label"] = sub(t["label"])
    for e in data["events"] + data["undated"]:
        e["note"] = sub(e["note"])
        e["sources"] = [sub(x) for x in e["sources"]]
    for u in data["undated"]:
        u["label"] = sub(u["label"])
    for o in data["obs"].values():
        o["label"] = sub(o["label"])
        o["text"] = sub(o["text"])
    return data


def parse_partial(s: str, end: bool) -> date:
    """First day of a partial date, or its last day when ``end`` is true."""
    parts = [int(p) for p in s.split("-")]
    y = parts[0]
    m = parts[1] if len(parts) > 1 else (12 if end else 1)
    if len(parts) > 2:
        d = parts[2]
    else:
        d = calendar.monthrange(y, m)[1] if end else 1
    return date(y, m, d)


NOTE_HEADER = re.compile(r"^### (\d{2}/\d{2}/\d{4}) \| ([^|]*)\|[^|]*\|([^|]*)\|.*$", re.M)
TAG_LINE = re.compile(r"^\[[a-z_]+\]\s*$", re.M)


def identity_masker(identifiers: list[str]):
    """Replace the planted identifiers of a fictional document by a neutral tag.

    The fictional names are made up, but the page should read like the app's
    output, where identities are already masked. Spaces in an identifier also
    match the ``~`` noise the dossiers put in some numbers.
    """
    pats = []
    for ident in sorted(set(identifiers), key=len, reverse=True):
        words = [re.escape(w) for w in re.split(r"[\s~]+", ident.strip()) if w]
        if not words:
            continue
        body = r"[\s~]+".join(words)
        pats.append(rf"(?<![\w]){body}(?![\w])")
    rx = re.compile("|".join(pats), re.I) if pats else None
    return (lambda text: rx.sub("[identité]", text)) if rx else (lambda text: text)


def dossier_observations(raw: dict, folder: Path) -> dict[str, dict]:
    """Full text of each observation of a fictional dossier, identities masked.

    Keys are the labels ``verite.json`` uses as sources: "historique 14/03/2022"
    for a note of a history, the document name for a letter or a report.
    """
    out: dict[str, dict] = {}
    for pdf, doc in raw.get("documents", {}).items():
        txt = folder / doc["source"]
        if not txt.exists():
            continue
        stem = Path(pdf).stem
        mask = identity_masker(doc.get("identifiers", []))
        text = txt.read_text(encoding="utf-8")
        heads = list(NOTE_HEADER.finditer(text))
        if not heads:
            body = mask(TAG_LINE.sub("", text)).strip()
            out[stem] = {"label": doc.get("type", stem), "date": None, "text": re.sub(r"\n{3,}", "\n\n", body)}
            continue
        for i, h in enumerate(heads):
            end = heads[i + 1].start() if i + 1 < len(heads) else len(text)
            d, kind, role = h.group(1), h.group(2).strip(), h.group(3).strip()
            out[f"{stem} {d}"] = {"label": f"{kind} · {role}", "date": d, "text": mask(text[h.end():end]).strip()}
    return out


def _tokens(text: str) -> set[str]:
    words = [w for w in re.findall(r"[a-z0-9]+", fold(text)) if w not in STOPWORDS and w not in GENERIC]
    return {_CANON.get(w, w[:6]) for w in words if len(w) > 2 or w.isdigit()}


def evidence_marks(text: str, label: str, note: str) -> list[list[int]]:
    """Character spans of the sentences of ``text`` that back an event.

    Heuristic: words shared with the event (its label and note), through the
    same synonym table as the scorer. Replace by quotes returned by the model
    once the frise schema asks for them.
    """
    want = _tokens(note) | label_tokens(label)
    core = label_tokens(label)
    scored = []
    for m in re.finditer(r"[^.!?\n]+[.!?]?", text):
        shared = _tokens(m.group()) & want
        if shared:
            scored.append((len(shared), bool(shared & core), m.start(), m.end()))
    if not scored:
        return []
    best = max(sc[0] for sc in scored)
    if best == 1:
        scored = [sc for sc in scored if sc[1]]
    else:
        scored = [sc for sc in scored if sc[0] >= max(2, 0.6 * best)]
    scored = sorted(scored, key=lambda sc: -sc[0])[:3]
    return sorted([sc[2], sc[3]] for sc in scored)


def load(path: Path, notes: Path | None = None) -> dict:
    """Normalise a verite.json or an app run into {tracks, events, sources}.

    ``notes``: for an app run, the dossier folder whose notes replace the
    summaries of the observations they match (same document and date).
    """
    raw = json.loads(path.read_text(encoding="utf-8"))
    tl = raw["timeline"]
    tracks: list[dict] = []
    events: list[dict] = []
    obs = {o["id"]: o for o in raw.get("observations", [])}

    if isinstance(tl, list):  # verite.json: events carry their own track
        index: dict[tuple[str, str], str] = {}
        for e in tl:
            key = (e["track"]["kind"], e["track"]["label"])
            if key not in index:
                index[key] = f"t{len(index) + 1}"
                tracks.append({"id": index[key], "kind": key[0], "label": key[1]})
            events.append(
                {
                    "track": index[key],
                    "start": e["start"],
                    "end": e.get("end"),
                    "ongoing": bool(e.get("ongoing")),
                    "mode": e.get("mode"),
                    "loss": bool(e.get("loss_of_control") or e.get("lossOfControl")),
                    "certainty": e.get("certainty"),
                    "note": e.get("note", ""),
                    "sources": e.get("sources", []),
                }
            )
    else:  # app run: tracks + events citing observations
        tracks = [{"id": t["id"], "kind": t["kind"], "label": t["label"]} for t in tl["tracks"]]
        for e in tl["events"]:
            srcs = []
            for oid in e.get("observationIds", []):
                o = obs.get(oid)
                if o:
                    srcs.append(f"{o['doc']} {o['date'] or 's.d.'}")
            events.append(
                {
                    "track": e["trackId"],
                    "start": e["start"],
                    "end": e.get("end"),
                    "ongoing": bool(e.get("ongoing")),
                    "mode": e.get("mode"),
                    "loss": bool(e.get("lossOfControl")),
                    "certainty": None,
                    "ageNote": age_note(e.get("fromAge")),
                    "note": e.get("note", ""),
                    "sources": srcs,
                }
            )
    # Antecedents told by age the app could not place (absent from older runs).
    undated: list[dict] = []
    if not isinstance(tl, list):
        track_of = {t["id"]: t for t in tracks}
        for u in tl.get("undated") or []:
            track = track_of.get(u.get("trackId"), {"kind": "life_event", "label": "Autre"})
            srcs = [f"{obs[oid]['doc']} {obs[oid]['date'] or 's.d.'}" for oid in u.get("observationIds", []) if oid in obs]
            undated.append(
                {
                    "kind": track["kind"],
                    "label": track["label"],
                    "startAge": u.get("startAge"),
                    "endAge": u.get("endAge"),
                    "ongoing": bool(u.get("ongoing")),
                    "mode": u.get("mode"),
                    "note": u.get("note", ""),
                    "sources": srcs,
                }
            )
    if isinstance(tl, list):
        observations = dossier_observations(raw, path.parent)
        for e in events:
            e["evidence"] = [src for src in e["sources"] if src in observations]
            e["sources"] = [src for src in e["sources"] if src not in observations]
    else:
        observations = {
            o["id"]: {"label": f"{o['doc']} · {o['kind']}", "date": o.get("date"), "text": o["summary"], "summary_only": True}
            for o in raw.get("observations", [])
        }
        if notes:
            full = dossier_observations(json.loads((notes / "verite.json").read_text(encoding="utf-8")), notes)
            for o in raw.get("observations", []):
                day = "/".join(reversed(o["date"].split("-"))) if o.get("date") else None
                note = full.get(f"{o['doc']} {day}") or full.get(o["doc"])
                if note:
                    observations[o["id"]] = {"label": f"{o['doc']} · {o['kind']}", "date": o.get("date"), "text": note["text"]}
        for e, raw_e in zip(events, tl["events"]):
            e["evidence"] = [oid for oid in raw_e.get("observationIds", []) if oid in observations]
    return {
        "dossier": raw.get("dossier") or path.parent.name,
        "tracks": tracks,
        "events": events,
        "undated": undated,
        "obs": observations,
    }


def prepare(data: dict) -> dict:
    """Resolve partial dates to ISO days; compute the reference 'today'."""
    last = date(1900, 1, 1)
    for e in data["events"]:
        s = parse_partial(e["start"], end=False)
        if e["end"]:
            t = parse_partial(e["end"], end=True)
            point = False
        elif e["ongoing"]:
            t, point = None, False
        else:
            t, point = None, True
        e["s"] = s.isoformat()
        e["e"] = t.isoformat() if t else None
        e["point"] = point
        e["startLabel"] = e["start"]
        e["endLabel"] = e["end"]
        last = max(last, s, t or s)
    for e in data["events"]:
        label = next(t["label"] for t in data["tracks"] if t["id"] == e["track"])
        e["evidence"] = [
            {"id": oid, "marks": [] if data["obs"][oid].get("summary_only") else evidence_marks(data["obs"][oid]["text"], label, e["note"])}
            for oid in e["evidence"]
        ]
    # Tracks holding only undated antecedents are listed under the frise instead.
    on_axis = {e["track"] for e in data["events"]}
    data["tracks"] = [t for t in data["tracks"] if t["id"] in on_axis]
    data.setdefault("undated", [])
    # ongoing events run up to a month after the last known date
    ref = date(last.year + (last.month // 12), last.month % 12 + 1, 1)
    data["ref"] = ref.isoformat()
    kinds = [k for k in KIND_ORDER if any(t["kind"] == k for t in data["tracks"])]
    order = {k: i for i, k in enumerate(kinds)}
    first = {}
    for e in data["events"]:
        first[e["track"]] = min(first.get(e["track"], e["s"]), e["s"])
    data["tracks"].sort(key=lambda t: (order[t["kind"]], first.get(t["id"], "9999")))
    data["kinds"] = [
        {"id": k, "label": KIND_LABEL[k], "light": KIND_COLOR[k][0], "dark": KIND_COLOR[k][1]} for k in kinds
    ]
    data["modeLabel"] = MODE_LABEL
    data["certaintyLabel"] = CERTAINTY_LABEL
    return data


PAGE = r"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Frise __TITLE__</title>
<style>
:root{--bg:#fafaf7;--fg:#1d1d1b;--mute:#6b6b66;--line:#d8d8d0;--panel:#fff;--axis:#1d1d1b}
@media (prefers-color-scheme:dark){:root{--bg:#161614;--fg:#eceae3;--mute:#9a9a92;--line:#34342f;--panel:#1f1f1c;--axis:#eceae3}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.4 system-ui,-apple-system,Segoe UI,sans-serif}
main{max-width:1200px;margin:0 auto;padding:12px 16px 32px}
h1{font-size:18px;margin:4px 0 2px}
.sub{color:var(--mute);margin:0 0 10px;font-size:13px}
.bar{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
button,.chip{font:inherit;border:1px solid var(--line);background:var(--panel);color:var(--fg);border-radius:999px;padding:5px 12px;cursor:pointer}
.chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px}
.chip i{width:10px;height:10px;border-radius:3px;display:inline-block}
.chip[aria-pressed=false]{opacity:.4}
.chart{background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden;touch-action:pan-y}
svg{display:block;width:100%}
text{fill:var(--fg);font-size:12px}
.mute{fill:var(--mute)}
.ev{cursor:pointer}
.ev:hover rect,.ev.sel rect,.ev:hover path,.ev.sel path{stroke:var(--fg);stroke-width:1.6}
#detail{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin-top:10px;min-height:76px}
#detail b{font-size:15px}
.obs{border:1px solid var(--line);border-radius:8px;margin-top:6px;overflow:hidden}
.oh{background:var(--bg);color:var(--mute);font-size:12px;padding:4px 10px;border-bottom:1px solid var(--line)}
.ot{white-space:pre-wrap;padding:8px 10px;max-height:240px;overflow:auto;font-size:13px}
mark{background:#fde047;color:#1d1d1b;border-radius:3px;padding:0 1px}
@media (prefers-color-scheme:dark){mark{background:#a16207;color:#fff}}
#detail .k{color:var(--mute);font-size:12px}
.legend{display:flex;gap:14px;flex-wrap:wrap;color:var(--mute);font-size:12px;margin-top:8px}
.sw{display:inline-block;width:22px;height:9px;border-radius:2px;vertical-align:middle;margin-right:4px}
#undated{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:8px 14px;margin-top:10px}
#undated h2{font-size:14px;margin:2px 0 4px}
#undated ul{margin:4px 0 2px;padding-left:18px}
#undated li{margin:3px 0}
#undated .k{color:var(--mute);font-size:12px}
</style>
</head>
<body>
<main>
<h1>Frise chronologique — __TITLE__</h1>
<p class="sub"><b>__BANNER__</b>. Touchez une barre pour lire la note et l'observation d'origine ; faites glisser la fenêtre de l'aperçu pour zoomer.</p>
<div class="bar" id="kinds"></div>
<div class="bar" id="presets"></div>
<div class="chart"><svg id="ov" height="54"></svg></div>
<div class="chart" style="margin-top:8px"><svg id="main"></svg></div>
<div class="legend" id="legend"></div>
__UNDATED__<div id="detail"><span class="k">Aucun élément sélectionné.</span></div>
</main>
<script>
const D = __DATA__;
const NS = "http://www.w3.org/2000/svg";
const dark = () => matchMedia("(prefers-color-scheme: dark)").matches;
const DAY = 864e5;
const t = (iso) => Date.parse(iso + "T00:00:00Z");
const REF = t(D.ref);
const kindOf = Object.fromEntries(D.kinds.map(k => [k.id, k]));
const trackOf = Object.fromEntries(D.tracks.map(x => [x.id, x]));
const color = (kind) => kindOf[kind][dark() ? "dark" : "light"];
const MODE_OP = {usage:.55, craving:.7, sevrage:.7, intoxication:.85, rechute:1};
const EVENTS = D.events.map((e, i) => ({
  ...e, i, kind: trackOf[e.track].kind, label: trackOf[e.track].label,
  a: t(e.s), b: e.e ? t(e.e) : (e.ongoing ? REF : t(e.s)),
}));
const hidden = new Set();
let LABEL_W = 150; const ROW = 26, PADR = 14, AXIS = 84;
let DOM_MIN = Math.min(...EVENTS.map(e => e.a)) - 200*DAY, DOM_MAX = REF + 60*DAY;
let view = [DOM_MIN, DOM_MAX];

const el = (name, attrs = {}, parent, text) => {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text !== undefined) n.textContent = text;
  if (parent) parent.appendChild(n);
  return n;
};
const fmt = (s) => { if (!s) return ""; const [y,m,d] = s.split("-"); return d ? `${d}/${m}/${y}` : m ? `${m}/${y}` : y; };
const yr = (ms) => new Date(ms).getUTCFullYear();

function ticks(a, b) {
  const span = (b - a) / (365.25*DAY), out = [];
  const step = span > 40 ? 10 : span > 18 ? 5 : span > 9 ? 2 : span > 3.5 ? 1 : 0;
  if (step) { for (let y = Math.ceil(yr(a)/step)*step; Date.UTC(y,0,1) <= b; y += step) out.push([Date.UTC(y,0,1), String(y), true]); }
  else {
    const q = span > 1.6 ? 3 : 1;
    for (let y = yr(a); y <= yr(b); y++) for (let m = 0; m < 12; m += q) {
      const v = Date.UTC(y, m, 1); if (v < a || v > b) continue;
      out.push([v, m === 0 ? String(y) : `${String(m+1).padStart(2,"0")}/${String(y).slice(2)}`, m === 0]);
    }
  }
  return out;
}

const bolt = (x, y, s=7) => `M${x} ${y-s} L${x-s*.55} ${y+.1} L${x-.05*s} ${y+.1} L${x-s*.35} ${y+s} L${x+s*.6} ${y-.25*s} L${x+.05*s} ${y-.25*s} Z`;

function drawMain() {
  const svg = document.getElementById("main");
  svg.replaceChildren();
  const W = svg.clientWidth || 800;
  LABEL_W = W < 600 ? 92 : 150;
  const innerW = W - LABEL_W - PADR;
  const x = (ms) => LABEL_W + (ms - view[0]) / (view[1] - view[0]) * innerW;
  const kinds = D.kinds.filter(k => !hidden.has(k.id));
  const rows = [];
  for (const k of kinds) if (k.id !== "life_event") {
    rows.push({head: k});
    for (const tr of D.tracks.filter(tr => tr.kind === k.id)) rows.push({track: tr});
  }
  const showLife = !hidden.has("life_event");
  const H = AXIS + 18 + rows.length * ROW + 24;
  svg.setAttribute("height", H); svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const defs = el("defs", {}, svg);
  const cp = el("clipPath", {id: "clip"}, defs); el("rect", {x: LABEL_W, y: 0, width: innerW, height: H}, cp);
  // grid + axis
  const gridG = el("g", {}, svg);
  for (const [v, lab, major] of ticks(...view)) {
    const xx = x(v);
    el("line", {x1: xx, x2: xx, y1: AXIS - 4, y2: H - 20, stroke: "var(--line)", "stroke-width": major ? 1 : .5}, gridG);
    el("text", {x: xx + 3, y: H - 7, class: "mute"}, gridG, lab);
  }
  el("line", {x1: LABEL_W, x2: W - PADR, y1: AXIS - 4, y2: AXIS - 4, stroke: "var(--axis)", "stroke-width": 4, "stroke-linecap": "round"}, svg);
  const g = el("g", {"clip-path": "url(#clip)"}, svg);
  // life events on the axis
  if (showLife) {
    const life = EVENTS.filter(e => e.kind === "life_event" && e.b >= view[0] && e.a <= view[1]);
    const lanes = [[], [], [], [], []];
    for (const e of life.sort((p, q) => p.a - q.a)) {
      const pt = e.point || (e.b - e.a) < 120*DAY;
      const xa = x(Math.max(e.a, view[0])), xb = pt ? xa : x(Math.min(e.b, view[1]));
      const w = e.label.length * 5.9 + 10, flip = xa + w > W - PADR;
      const iv = flip ? [xa - w, xa + 4] : [xa - 4, xa + w];
      let ln = lanes.findIndex(l => l.every(o => o[1] < iv[0] || o[0] > iv[1]));
      if (ln < 0) ln = lanes.length - 1;
      lanes[ln].push(iv);
      const ty = AXIS - 14 - ln * 13 - 4;
      const grp = el("g", {class: "ev", "data-i": e.i}, g);
      if (!pt) el("rect", {x: xa, y: AXIS - 8, width: Math.max(2, xb - xa), height: 8, rx: 3, fill: color("life_event"), opacity: .85}, grp);
      else el("path", {d: `M${xa} ${AXIS-11} l6 6 l-6 6 l-6 -6 Z`, fill: color("life_event")}, grp);
      el("line", {x1: xa, x2: xa, y1: ty + 3, y2: AXIS - 11, stroke: color("life_event"), "stroke-width": 1, opacity: .6}, grp);
      el("text", {x: flip ? xa - 3 : xa + 3, y: ty, "font-size": 11, "text-anchor": flip ? "end" : "start", "pointer-events": "none"}, grp, e.label);
      if (e.loss) el("path", {d: bolt(xa, AXIS + 6, 6), fill: "#e11d48"}, grp);
    }
  }
  // rows
  let y = AXIS + 6;
  for (const r of rows) {
    if (r.head) {
      el("text", {x: 6, y: y + 17, "font-weight": 600, fill: color(r.head.id)}, svg, r.head.label.toUpperCase()).setAttribute("font-size", 11);
      el("line", {x1: 6, x2: W - PADR, y1: y + ROW - 3, y2: y + ROW - 3, stroke: color(r.head.id), opacity: .35}, svg);
    } else {
      const cut = W < 600 ? 13 : 24;
      const lab = r.track.label.length > cut ? r.track.label.slice(0, cut - 1) + "…" : r.track.label;
      el("text", {x: 12, y: y + 17, class: "mute"}, svg, lab).appendChild(Object.assign(document.createElementNS(NS, "title"), {textContent: r.track.label}));
      for (const e of EVENTS.filter(e => e.track === r.track.id)) {
        if (e.b < view[0] || e.a > view[1]) continue;
        const grp = el("g", {class: "ev", "data-i": e.i}, g);
        const c = color(e.kind), op = e.mode ? (MODE_OP[e.mode] ?? .6) : .8;
        const xa = x(e.a), xb = x(e.b);
        const dash = e.certainty === "approx" || e.ageNote ? "4 3" : null;
        if (e.point || xb - xa < 5) {
          const pt = el("path", {d: `M${xa} ${y+5} l7 7 l-7 7 l-7 -7 Z`, fill: c, opacity: op}, grp);
          if (dash) { pt.setAttribute("stroke", c); pt.setAttribute("stroke-dasharray", "2 2"); pt.setAttribute("fill-opacity", .45); }
        } else {
          const rc = el("rect", {x: xa, y: y + 4, width: xb - xa, height: ROW - 10, rx: 4, fill: c, opacity: op}, grp);
          if (dash) { rc.setAttribute("stroke", c); rc.setAttribute("stroke-dasharray", dash); rc.setAttribute("fill-opacity", .45); }
          if (e.ongoing && xb < W) el("path", {d: `M${xb} ${y+4} l8 ${(ROW-10)/2} l-8 ${(ROW-10)/2} Z`, fill: c, opacity: op}, grp);
        }
        if (e.loss) el("path", {d: bolt(xa, y + ROW/2 - 1), fill: "#e11d48", stroke: "var(--panel)", "stroke-width": .8}, grp);
        if (e.mode && e.mode !== "usage" && xb - xa > 56) el("text", {x: xa + 6, y: y + 17, fill: "#fff", "font-size": 10.5, "pointer-events": "none"}, grp, MODE_LABEL(e.mode)).setAttribute("style", "fill:#fff");
      }
    }
    y += ROW;
  }
  svg.querySelectorAll(".ev").forEach(n => {
    const go = () => select(+n.dataset.i);
    n.addEventListener("click", go); n.addEventListener("pointerenter", (ev) => { if (ev.pointerType === "mouse") go(); });
  });
  if (selected !== null) svg.querySelector(`.ev[data-i="${selected}"]`)?.classList.add("sel");
}
const MODE_LABEL = (m) => D.modeLabel[m] || m;

let selected = null;
function obsHtml(v, esc) {
  const o = D.obs[v.id];
  let html = "", at = 0;
  for (const [a, b] of v.marks) { html += esc(o.text.slice(at, a)) + "<mark>" + esc(o.text.slice(a, b)) + "</mark>"; at = b; }
  html += esc(o.text.slice(at));
  return `<div class="obs"><div class="oh">${o.date ? esc(o.date) + " · " : ""}${esc(o.label)}${o.summary_only ? " · résumé" : ""}</div><div class="ot">${html}</div></div>`;
}
function select(i) {
  selected = i;
  document.querySelectorAll(".ev").forEach(n => n.classList.toggle("sel", +n.dataset.i === i));
  const e = EVENTS[i];
  const when = e.endLabel ? (e.startLabel === e.endLabel ? fmt(e.startLabel) : `${fmt(e.startLabel)} → ${fmt(e.endLabel)}`)
    : e.ongoing ? `depuis ${fmt(e.startLabel)} (en cours)` : fmt(e.startLabel);
  const esc = (s) => String(s).replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
  const bits = [];
  if (e.mode) bits.push(MODE_LABEL(e.mode));
  if (e.certainty) bits.push(D.certaintyLabel[e.certainty] || e.certainty);
  if (e.ageNote) bits.push(e.ageNote);
  if (e.loss) bits.push("⚡ perte de contrôle");
  document.getElementById("detail").innerHTML =
    `<b>${esc(e.label)}</b> <span class="k">· ${esc(kindOf[e.kind].label)} · ${when}${bits.length ? " · " + esc(bits.join(" · ")) : ""}</span>` +
    (e.note ? `<div>${esc(e.note)}</div>` : "") +
    (e.sources.length ? `<div class="k">Autres sources : ${e.sources.map(esc).join(" ; ")}</div>` : "") +
    (e.evidence.length ? `<div class="k" style="margin-top:8px">${e.evidence.length > 1 ? "Observations" : "Observation"} d'origine${e.evidence.some(v => !v.marks.length) ? " (passage justificatif non repéré dans certaines)" : ", passage justificatif surligné"} :</div><div id="obs">` +
      e.evidence.map(v => obsHtml(v, esc)).join("") + `</div>` : "");
  document.querySelector("#obs mark")?.scrollIntoView({block: "nearest"});
}

// overview strip with a draggable window
function drawOverview() {
  const svg = document.getElementById("ov");
  svg.replaceChildren();
  const W = svg.clientWidth || 800, H = 54, L = 12, R = 12, innerW = W - L - R;
  const x = (ms) => L + (ms - DOM_MIN) / (DOM_MAX - DOM_MIN) * innerW;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  for (const [v, lab, major] of ticks(DOM_MIN, DOM_MAX)) {
    if (!major) continue;
    el("line", {x1: x(v), x2: x(v), y1: 4, y2: H - 14, stroke: "var(--line)"}, svg);
    el("text", {x: x(v) + 2, y: H - 3, class: "mute", "font-size": 10}, svg, lab);
  }
  const vis = EVENTS.filter(e => !hidden.has(e.kind));
  const n = Math.max(1, new Set(vis.map(e => e.track)).size), tracks = [...new Set(vis.map(e => e.track))];
  for (const e of vis) {
    const r = tracks.indexOf(e.track), yy = 6 + r * (H - 24) / n;
    el("rect", {x: x(e.a), y: yy, width: Math.max(2, x(e.b) - x(e.a)), height: Math.max(1.5, (H - 24) / n - 1), fill: color(e.kind), opacity: .7}, svg);
  }
  const win = el("rect", {x: x(view[0]), y: 1, width: Math.max(10, x(view[1]) - x(view[0])), height: H - 14, rx: 5, fill: "rgba(80,120,220,.16)", stroke: "#4f7be0", "stroke-width": 1.5, style: "cursor:grab"}, svg);
  const hl = el("rect", {x: x(view[0]) - 5, y: 1, width: 10, height: H - 14, fill: "#4f7be0", opacity: .01, style: "cursor:ew-resize"}, svg);
  const hr = el("rect", {x: x(view[1]) - 5, y: 1, width: 10, height: H - 14, fill: "#4f7be0", opacity: .01, style: "cursor:ew-resize"}, svg);
  const inv = (px) => DOM_MIN + (px - L) / innerW * (DOM_MAX - DOM_MIN);
  const MINSPAN = 120 * DAY;
  const drag = (node, kind) => node.addEventListener("pointerdown", (ev) => {
    ev.preventDefault(); node.setPointerCapture(ev.pointerId);
    const x0 = ev.clientX, v0 = [...view], per = (DOM_MAX - DOM_MIN) / innerW;
    const move = (m) => {
      const d = (m.clientX - x0) * per;
      let [a, b] = v0;
      if (kind === "move") { const span = b - a; a = Math.min(Math.max(DOM_MIN, a + d), DOM_MAX - span); b = a + span; }
      else if (kind === "l") a = Math.min(Math.max(DOM_MIN, a + d), b - MINSPAN);
      else b = Math.max(Math.min(DOM_MAX, b + d), a + MINSPAN);
      view = [a, b]; drawOverview(); drawMain();
    };
    const up = () => { node.removeEventListener("pointermove", move); node.removeEventListener("pointerup", up); };
    node.addEventListener("pointermove", move); node.addEventListener("pointerup", up);
  });
  drag(win, "move"); drag(hl, "l"); drag(hr, "r");
}

function setView(a, b) { view = [Math.max(DOM_MIN, a), Math.min(DOM_MAX, b)]; redraw(); }
function redraw() { drawOverview(); drawMain(); }

// controls
const kindsBar = document.getElementById("kinds");
for (const k of D.kinds) {
  const b = document.createElement("button"); b.className = "chip"; b.setAttribute("aria-pressed", "true");
  b.innerHTML = `<i style="background:${k[dark() ? "dark" : "light"]}"></i>${k.label}`;
  b.onclick = () => { hidden.has(k.id) ? hidden.delete(k.id) : hidden.add(k.id); b.setAttribute("aria-pressed", String(!hidden.has(k.id))); redraw(); };
  kindsBar.appendChild(b);
}
const presets = document.getElementById("presets");
const addPreset = (label, fn) => { const b = document.createElement("button"); b.textContent = label; b.onclick = fn; presets.appendChild(b); };
addPreset("Tout", () => setView(DOM_MIN, DOM_MAX));
for (const yrs of [10, 5, 2]) addPreset(`${yrs} dernières années`, () => setView(REF - yrs * 365.25 * DAY, DOM_MAX));
addPreset("−", () => { const c = (view[0] + view[1]) / 2, h = (view[1] - view[0]); setView(c - h, c + h); });
addPreset("+", () => { const c = (view[0] + view[1]) / 2, h = (view[1] - view[0]) / 4; setView(c - h, c + h); });
document.getElementById("legend").innerHTML =
  `<span><span class="sw" style="background:#888;opacity:.55"></span>usage</span><span><span class="sw" style="background:#888;opacity:.85"></span>intoxication</span>` +
  `<span><span class="sw" style="background:#888"></span>rechute</span><span><span class="sw" style="background:#888;opacity:.45;border:1px dashed #888"></span>date approximative ou d'après l'âge</span>` +
  `<span style="color:#e11d48">⚡ perte de contrôle</span><span>◆ événement sans durée</span><span>▶ en cours</span>`;
document.getElementById("main").addEventListener("wheel", (ev) => {
  if (!ev.ctrlKey && !ev.shiftKey) return;
  ev.preventDefault();
  const r = ev.currentTarget.getBoundingClientRect(), W = r.width, f = (ev.clientX - r.left - LABEL_W) / (W - LABEL_W - PADR);
  const c = view[0] + Math.min(Math.max(f, 0), 1) * (view[1] - view[0]), k = ev.deltaY > 0 ? 1.25 : .8;
  setView(c - (c - view[0]) * k, c + (view[1] - c) * k);
}, {passive: false});
addEventListener("resize", redraw);
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redraw);
if (innerWidth < 600) view = [Math.max(DOM_MIN, REF - 5 * 365.25 * DAY), DOM_MAX];
redraw();
</script>
</body>
</html>
"""


def undated_html(undated: list[dict]) -> str:
    """Static list of the antecedents told by age that are not on the axis."""
    if not undated:
        return ""
    esc = html.escape
    items = []
    for u in undated:
        age = format_age(u.get("startAge"))
        if u.get("endAge"):
            age += f" → {format_age(u['endAge'])}"
        elif u.get("ongoing"):
            age += " → en cours"
        bits = [f"<b>{esc(u['label'])}</b> <span class=\"k\">· {esc(KIND_LABEL.get(u['kind'], u['kind']))}"]
        if u.get("mode"):
            bits.append(f" · {esc(MODE_LABEL.get(u['mode'], u['mode']))}")
        bits.append(f" · {esc(age)}</span>")
        if u.get("note"):
            bits.append(f" — {esc(u['note'])}")
        if u.get("sources"):
            bits.append(f' <span class="k">({esc(" ; ".join(u["sources"]))})</span>')
        items.append(f"<li>{''.join(bits)}</li>")
    return (
        '<section id="undated"><h2>Antécédents non datés</h2>'
        '<div class="k">Racontés par l\'âge, sans date de naissance connue ou au-delà de la dernière observation : '
        "ils ne sont pas placés sur la frise.</div>"
        f"<ul>{''.join(items)}</ul></section>\n"
    )


def render(data: dict, banner: str = BANNERS["synthetic"]) -> str:
    payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    return (
        PAGE.replace("__TITLE__", html.escape(data["dossier"]))
        .replace("__BANNER__", html.escape(banner))
        .replace("__UNDATED__", undated_html(data.get("undated", [])))
        .replace("__DATA__", payload)
    )


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("frise", type=Path, help="verite.json of a fictional dossier, or an app run (JSON)")
    ap.add_argument("--notes", type=Path, help="for an app run: the fictional dossier folder, to show full notes")
    ap.add_argument("--key", type=Path, help='correspondence table {"labels": {"[PATIENT]": "..."}}: real values in place of labels')
    ap.add_argument(
        "--banner",
        default=None,
        help='"synthetic" (default), "real" (real dossier, pseudonymised; re-identified with --key), or any text',
    )
    ap.add_argument("-o", "--out", type=Path, required=True)
    args = ap.parse_args(argv)
    data = load(args.frise, args.notes)
    if args.key:
        data = reidentify(data, load_key(args.key))
    data = prepare(data)
    if args.key and args.banner in (None, "real", "synthetic"):
        banner = BANNERS["reidentified"]
    else:
        banner = BANNERS.get(args.banner or "synthetic", args.banner)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(render(data, banner), encoding="utf-8")
    print(f"{args.out}: {len(data['events'])} événements, {len(data['tracks'])} pistes", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
