"""Score a frise produced by the app against a dossier's ``verite.json``.

The expected frise (``timeline``) is written in the app's model: tracks of a
fixed kind, partial dates (``YYYY``, ``YYYY-MM``, ``YYYY-MM-DD``), a usage
mode for substance tracks, and how certain each date is. The produced frise
is what ``web/scripts/run-frise.ts`` saves: observations, then tracks and
events that cite those observations.

Each expected event ends in one of four states:

- ``found``: same kind, same label (up to wording), compatible start date;
- ``misdated``: same kind and label, start date outside the tolerance;
- ``other_track``: label and start right, filed under another kind;
- ``missed``.

Produced events matched to nothing are ``extra``: either a model error or a
true fact the expected frise leaves out, so precision is a lower bound and
extras are listed for a human to read.
"""
from __future__ import annotations

import calendar
import re
import unicodedata
from dataclasses import dataclass, field
from datetime import date, timedelta

# Days of slack around the expected date, by how certain it is. "approx"
# means the notes disagree or only say "vers 2015": a year either way.
TOLERANCE_DAYS = {"exact": 3, "month": 15, "year": 0, "approx": 366}

STOPWORDS = {
    "a", "au", "aux", "avec", "d", "de", "des", "du", "en", "et", "hors", "l", "la", "le", "les",
    "par", "pour", "sa", "sans", "son", "ses", "sur", "un", "une",
}

# Words clinicians use for the same thing. Each token is mapped to the first
# word of its group before labels are compared.
SYNONYMS = [
    {"opioides", "opioide", "opiaces", "opiace", "heroine"},
    {"benzodiazepines", "benzodiazepine", "bzd", "clonazepam", "rivotril"},
    {"cocaine", "crack"},
    {"cannabis", "thc"},
    {"alcool", "oh"},
    {"tabac", "cigarettes", "tabagisme"},
    {"vhc", "hepatite"},
    {"tdah", "hyperactivite"},
    {"overdose", "od", "surdose"},
    {"psychotherapie", "tcc", "psychologique", "psychologue"},
    {"hospitalisation", "hospitalisee", "hospitalise"},
    {"deces", "deuil", "mort"},
    {"naissance", "nee"},
    {"incarceration", "detention", "prison"},
    {"rupture", "separation", "separee", "separe"},
    {"substituts", "patchs", "patch", "tsn"},
]
# Words that say what kind of care or problem it is, not which one: "Suivi
# psychiatrique" and "Suivi éducatif" are different tracks.
GENERIC = {"suivi", "consultation", "consultations", "prise", "charge", "episode", "trouble", "accompagnement"}
_CANON = {w: sorted(group)[0] for group in SYNONYMS for w in group}

# Multi-word names rewritten before tokenizing (on folded, lowercased text).
PHRASES = {
    "intoxication medicamenteuse volontaire": "tentative suicide",
    "imv": "tentative suicide",
    "consultation jeunes consommateurs": "cjc",
    "reduction des risques": "rdr",
}


def fold(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    return "".join(c for c in s if not unicodedata.combining(c)).lower()


def label_tokens(label: str) -> set[str]:
    text = " ".join(re.findall(r"[a-z0-9]+", fold(label)))
    for phrase, alias in PHRASES.items():
        text = re.sub(rf"\b{phrase}\b", alias, text)
    words = [w for w in text.split() if w not in STOPWORDS]
    specific = [w for w in words if w not in GENERIC] or words
    return {_CANON.get(w, w[:6]) for w in specific}


def label_similarity(a: str, b: str) -> float:
    """Share of the shorter label's words found in the other one."""
    ta, tb = label_tokens(a), label_tokens(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / min(len(ta), len(tb))


def period(partial: str) -> tuple[date, date]:
    """First and last day of a partial date."""
    parts = [int(p) for p in partial.split("-")]
    if len(parts) == 1:
        return date(parts[0], 1, 1), date(parts[0], 12, 31)
    if len(parts) == 2:
        y, m = parts
        return date(y, m, 1), date(y, m, calendar.monthrange(y, m)[1])
    d = date(*parts)
    return d, d


def dates_compatible(expected: str | None, produced: str | None, certainty: str) -> bool:
    """Do the two partial dates overlap, given the expected date's slack?"""
    if expected is None or produced is None:
        return expected is None and produced is None
    slack = timedelta(days=TOLERANCE_DAYS.get(certainty, 0))
    e0, e1 = period(expected)
    p0, p1 = period(produced)
    return p0 <= e1 + slack and p1 >= e0 - slack


def precision_of(partial: str) -> int:
    return partial.count("-") + 1


@dataclass
class Produced:
    """A produced event, flattened with its track and its sources."""

    id: str
    kind: str
    label: str
    start: str
    end: str | None
    ongoing: bool
    mode: str | None
    note: str
    sources: list[str]


@dataclass
class Match:
    expected: dict
    status: str  # found, misdated, other_track, missed
    produced: Produced | None = None
    checks: dict[str, bool | None] = field(default_factory=dict)


def observation_label(obs: dict) -> str:
    """How verite.json names a source: "historique 14/03/2022", or the document."""
    if obs["doc"] == "historique" and obs.get("date"):
        y, m, d = obs["date"].split("-")
        return f"historique {d}/{m}/{y}"
    return obs["doc"]


def produced_events(run: dict) -> list[Produced]:
    obs = {o["id"]: observation_label(o) for o in run["observations"]}
    tracks = {t["id"]: t for t in run["timeline"]["tracks"]}
    out = []
    for e in run["timeline"]["events"]:
        t = tracks[e["trackId"]]
        out.append(
            Produced(
                id=e["id"], kind=t["kind"], label=t["label"], start=e["start"], end=e["end"],
                ongoing=e["ongoing"], mode=e["mode"], note=e["note"],
                sources=[obs[i] for i in e["observationIds"] if i in obs],
            )
        )
    return out


def _pair_score(exp: dict, p: Produced, *, same_kind: bool, need_date: bool) -> float | None:
    """Higher is a better pairing; None if the pair is not allowed at this tier."""
    if (p.kind == exp["track"]["kind"]) != same_kind:
        return None
    sim = label_similarity(exp["track"]["label"], p.label)
    if not same_kind and exp.get("mode"):
        # "Alcool, sevrage" filed as the care episode "Sevrage hospitalier".
        sim = max(sim, label_similarity(f'{exp["track"]["label"]} {exp["mode"]}', p.label))
    if sim < 0.5:
        return None
    start_ok = dates_compatible(exp["start"], p.start, exp["certainty"])
    if need_date and not start_ok:
        return None
    # Without the date to vouch for the pairing, a substance event must at
    # least be the same mode: a "craving" is not a misdated "rechute".
    if not need_date and exp["track"]["kind"] == "substance_use" and exp.get("mode") != p.mode:
        return None
    score = sim + (1.0 if start_ok else 0.0)
    if exp.get("mode") is not None and exp.get("mode") == p.mode:
        score += 0.5
    if exp.get("end") and p.end and dates_compatible(exp["end"], p.end, exp["certainty"]):
        score += 0.25
    # Prefer the closest start among compatible ones.
    gap = abs((period(p.start)[0] - period(exp["start"])[0]).days)
    return score - min(gap, 3650) / 36500


def match_timeline(expected: list[dict], produced: list[Produced]) -> tuple[list[Match], list[Produced]]:
    """Greedy one-to-one matching, strictest tier first."""
    matches: dict[int, Match] = {}
    used: set[str] = set()
    tiers = [("found", True, True), ("other_track", False, True), ("misdated", True, False)]
    for status, same_kind, need_date in tiers:
        pairs = []
        for i, exp in enumerate(expected):
            if i in matches:
                continue
            for p in produced:
                if p.id in used:
                    continue
                s = _pair_score(exp, p, same_kind=same_kind, need_date=need_date)
                if s is not None:
                    pairs.append((s, i, p))
        for s, i, p in sorted(pairs, key=lambda x: -x[0]):
            if i in matches or p.id in used:
                continue
            matches[i] = Match(expected=expected[i], status=status, produced=p)
            used.add(p.id)

    result = []
    for i, exp in enumerate(expected):
        m = matches.get(i) or Match(expected=exp, status="missed")
        if m.produced is not None:
            m.checks = event_checks(exp, m.produced)
        result.append(m)
    extras = [p for p in produced if p.id not in used]
    return result, extras


def event_checks(exp: dict, p: Produced) -> dict[str, bool | None]:
    """Field-by-field agreement of a matched pair (None: nothing to check)."""
    cert = exp["certainty"]
    exp_sources = set()
    for s in exp.get("sources", []):
        exp_sources.add(s)
    return {
        "start": dates_compatible(exp["start"], p.start, cert),
        "start_as_precise": precision_of(p.start) >= precision_of(exp["start"]),
        "end": dates_compatible(exp.get("end"), p.end, cert) if (exp.get("end") or p.end) else None,
        "ongoing": bool(exp.get("ongoing", False)) == p.ongoing,
        "mode": (exp.get("mode") == p.mode) if exp["track"]["kind"] == "substance_use" else None,
        "source": bool(exp_sources & set(p.sources)) if exp_sources else None,
    }


# --- segmentation -----------------------------------------------------------

NOTE_HEADER = re.compile(r"^### (\d{2})/(\d{2})/(\d{4}) \|", re.M)


def expected_observations(dossier_dir) -> dict[str, list[str | None]]:
    """Dates of the notes each PDF holds: one per "###" note in a historique,
    one observation for a letter or an emergency report."""
    out: dict[str, list[str | None]] = {}
    for pdf in sorted(dossier_dir.glob("*.pdf")):
        source = dossier_dir / ("notes.txt" if pdf.stem == "historique" else f"{pdf.stem}.txt")
        text = source.read_text(encoding="utf8")
        dates = [f"{y}-{m}-{d}" for d, m, y in NOTE_HEADER.findall(text)]
        out[pdf.stem] = dates if dates else [None]
    return out


def segmentation_score(expected: dict[str, list[str | None]], observations: list[dict]) -> dict:
    by_doc: dict[str, list[str | None]] = {}
    for o in observations:
        by_doc.setdefault(o["doc"], []).append(o.get("date"))
    docs = {}
    for doc, exp_dates in expected.items():
        got = by_doc.get(doc, [])
        remaining = list(got)
        dated = 0
        for d in exp_dates:
            if d is not None and d in remaining:
                remaining.remove(d)
                dated += 1
        docs[doc] = {
            "expected": len(exp_dates),
            "produced": len(got),
            "dates_right": dated,
            "dated_expected": sum(d is not None for d in exp_dates),
        }
    return docs


# --- what the code's validation dropped -------------------------------------

PARTIAL = re.compile(r"^\d{4}(-\d{2}(-\d{2})?)?$")
TRACK_KINDS = {"substance_use", "psychiatric", "somatic", "medication", "therapeutic_psycho", "life_event"}


def _valid_partial(s) -> bool:
    if not isinstance(s, str) or not PARTIAL.match(s):
        return False
    try:
        period(s)
    except ValueError:
        return False
    return True


def short_ids(observations: list[dict]) -> dict[str, str]:
    """The ids the model is shown ("o1", "o2"…), as buildTimeline numbers them:
    observations by date, undated last, then mapped back to the real ids."""
    ordered = sorted(observations, key=lambda o: o.get("date") or "9999")
    return {f"o{i + 1}": o["id"] for i, o in enumerate(ordered)}


def validation_drops(run: dict) -> dict[str, int]:
    """Replay web/src/notebook/timeline.ts:assembleTimeline on the raw answers."""
    known = {o["id"] for o in run["observations"]}
    real = short_ids(run["observations"])
    counts = {"raw": 0, "bad_kind": 0, "bad_start": 0, "no_known_source": 0, "kept": 0, "merged": 0}
    for answer in run.get("rawAnswers", []):
        if answer["schema"] != "frise" or not isinstance(answer["content"], dict):
            continue
        for e in answer["content"].get("events", []):
            counts["raw"] += 1
            if e.get("kind") not in TRACK_KINDS:
                counts["bad_kind"] += 1
            elif not _valid_partial(e.get("start")):
                counts["bad_start"] += 1
            elif not any(real.get(i, i) in known for i in e.get("observation_ids", [])):
                counts["no_known_source"] += 1
            else:
                counts["kept"] += 1
    counts["merged"] = counts["kept"] - len(run["timeline"]["events"])
    return counts


def score_run(run: dict, verite: dict, dossier_dir) -> dict:
    produced = produced_events(run)
    matches, extras = match_timeline(verite["timeline"], produced)
    n_exp = len(matches)
    found = sum(m.status == "found" for m in matches)
    matched_produced = sum(m.produced is not None and m.status == "found" for m in matches)
    checks: dict[str, list[bool]] = {}
    for m in matches:
        if m.status != "found":
            continue
        for k, v in m.checks.items():
            if v is not None:
                checks.setdefault(k, []).append(v)
    by_kind: dict[str, list[int]] = {}
    for m in matches:
        k = m.expected["track"]["kind"]
        by_kind.setdefault(k, [0, 0])
        by_kind[k][1] += 1
        by_kind[k][0] += m.status == "found"
    return {
        "expected": n_exp,
        "produced": len(produced),
        "status": {s: sum(m.status == s for m in matches) for s in ("found", "misdated", "other_track", "missed")},
        "recall": found / n_exp if n_exp else 0.0,
        "precision_lower_bound": matched_produced / len(produced) if produced else 0.0,
        "checks": {k: (sum(v), len(v)) for k, v in checks.items()},
        "by_kind": by_kind,
        "segmentation": segmentation_score(expected_observations(dossier_dir), run["observations"]),
        "validation": validation_drops(run),
        "matches": matches,
        "extras": extras,
    }
