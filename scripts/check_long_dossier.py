"""Check a long fictional dossier (data/anonymized/dossiers-longs/<slug>):
shape of verite.json, sources that exist, origins that hold, and size.

    uv run python scripts/check_long_dossier.py <slug> [<slug> ...]
    uv run python scripts/check_long_dossier.py            # all of them

Exit code 1 on an error; warnings (size outside the target) do not fail.
"""

from __future__ import annotations

import json
import re
import statistics
import sys
from datetime import date
from pathlib import Path

from addictoscope.frise_eval import PARTIAL, TRACK_KINDS, period

ROOT = Path(__file__).resolve().parent.parent
LONG = ROOT / "data" / "anonymized" / "dossiers-longs"
MODES = {"usage", "intoxication", "sevrage", "rechute", "craving"}
CERTAINTY = {"exact", "month", "year", "approx"}
ORIGINS = {"intake", "follow_up", "late"}
NOTE = re.compile(
    r"^### (\d{2})/(\d{2})/(\d{4}) \|([^|]*)\|([^|]*)\|([^|]*)\|\s*(le|auto|modif) \d{2}/\d{2}/\d{4} \d{2}:\d{2}\s*$"
)
INTAKE_DAYS = 31
LATE_DAYS = 183
TARGETS = {
    "words": (9000, 13500),
    "notes": (45, 80),
    "years": (4, 9.5),
    "median_words": (55, 120),
    "longest_words": (700, 1500),
    "events": (70, 140),
    "late": (6, 40),
    "contradictions": (6, 12),
}


def words(text: str) -> int:
    return len(text.split())


def check(slug: str) -> tuple[list[str], list[str], dict]:
    folder = LONG / slug
    errors: list[str] = []
    warnings: list[str] = []
    truth = json.loads((folder / "verite.json").read_text())
    source = (folder / "notes.txt").read_text()

    notes: list[tuple[date, int]] = []
    for block in re.split(r"^(?=### )", source, flags=re.MULTILINE):
        if not block.startswith("### "):
            continue
        head, _, body = block.partition("\n")
        m = NOTE.match(head)
        if not m:
            errors.append(f"note header not in the expected form: {head[:80]!r}")
            continue
        d, mo, y = int(m[1]), int(m[2]), int(m[3])
        notes.append((date(y, mo, d), words(body)))
    if not notes:
        return [*errors, "no note"], warnings, {}
    if [n[0] for n in notes] != sorted(n[0] for n in notes):
        errors.append("notes.txt is not in chronological order")
    first, last = notes[0][0], notes[-1][0]
    labels = {f"historique {d:%d/%m/%Y}" for d, _ in notes}
    other_docs = {
        Path(name).stem
        for name in truth["documents"]
        if Path(name).stem != "historique"
    }

    for key in ("summary", "header", "documents", "timeline", "contradictions"):
        if key not in truth:
            errors.append(f"verite.json: missing {key!r}")
    counts = {o: 0 for o in ORIGINS}
    for i, e in enumerate(truth.get("timeline", [])):
        where = f"timeline[{i}] ({e.get('track', {}).get('label')!r}, {e.get('start')})"
        kind = e.get("track", {}).get("kind")
        if kind not in TRACK_KINDS:
            errors.append(f"{where}: unknown kind {kind!r}")
        if not e.get("track", {}).get("label"):
            errors.append(f"{where}: no label")
        for bound in ("start", "end"):
            v = e.get(bound)
            if v is None and bound == "end":
                continue
            if not isinstance(v, str) or not PARTIAL.match(v):
                errors.append(
                    f"{where}: {bound} {v!r} is not YYYY, YYYY-MM or YYYY-MM-DD"
                )
        if e.get("certainty") not in CERTAINTY:
            errors.append(f"{where}: certainty {e.get('certainty')!r}")
        if e.get("mode") is not None and (
            kind != "substance_use" or e["mode"] not in MODES
        ):
            errors.append(f"{where}: mode {e['mode']!r}")
        if kind == "substance_use" and e.get("mode") is None:
            errors.append(f"{where}: a substance event needs a mode")
        if e.get("ongoing") and e.get("end"):
            errors.append(f"{where}: ongoing with an end")
        if not e.get("note"):
            errors.append(f"{where}: no note")
        origin = e.get("origin")
        if origin not in ORIGINS:
            errors.append(f"{where}: origin {origin!r}")
            continue
        counts[origin] += 1
        sources = e.get("sources") or []
        if not sources:
            errors.append(f"{where}: no source")
            continue
        dated = []
        for s in sources:
            if s in labels:
                d, mo, y = s.split(" ")[1].split("/")
                dated.append(date(int(y), int(mo), int(d)))
            elif s not in other_docs:
                errors.append(
                    f"{where}: source {s!r} is neither a note date nor a document"
                )
        try:
            start_lo, start_hi = period(e["start"])
            if e.get("end") and period(e["end"])[1] < start_lo:
                errors.append(f"{where}: ends before it starts")
        except (ValueError, KeyError, TypeError):
            continue
        if not dated:
            continue
        first_mention = min(dated)
        in_intake = (first_mention - first).days <= INTAKE_DAYS
        if origin == "intake" and not (in_intake and start_lo <= first):
            errors.append(
                f"{where}: 'intake' but first written {first_mention:%d/%m/%Y} or starts after the first note"
            )
        if origin == "late" and (
            in_intake or (first_mention - start_hi).days < LATE_DAYS
        ):
            errors.append(
                f"{where}: 'late' but written at intake or within six months of its start"
            )
        if origin == "follow_up" and (
            start_hi < first or (first_mention - start_hi).days >= LATE_DAYS
        ):
            errors.append(
                f"{where}: 'follow_up' but starts before the first note or is first written six months later"
            )
        if first_mention < start_lo and e.get("certainty") != "approx":
            warnings.append(
                f"{where}: first source {first_mention:%d/%m/%Y} is before the start"
            )
    for i, c in enumerate(truth.get("contradictions", [])):
        if not c.get("topic") or not c.get("reading") or len(c.get("versions", [])) < 2:
            errors.append(
                f"contradictions[{i}]: needs a topic, at least two versions and a reading"
            )

    lengths = [n for _, n in notes]
    stats = {
        "words": sum(lengths),
        "notes": len(notes),
        "years": round((last - first).days / 365.25, 1),
        "median_words": int(statistics.median(lengths)),
        "p90_words": int(statistics.quantiles(lengths, n=10)[-1])
        if len(lengths) > 9
        else max(lengths),
        "longest_words": max(lengths),
        "longest_rank": lengths.index(max(lengths)) + 1,
        "events": len(truth.get("timeline", [])),
        **counts,
        "contradictions": len(truth.get("contradictions", [])),
    }
    for key, (lo, hi) in TARGETS.items():
        if not lo <= stats[key] <= hi:
            warnings.append(f"{key} = {stats[key]}, target {lo} to {hi}")
    if stats["longest_rank"] > 4:
        warnings.append(
            f"the longest note is note {stats['longest_rank']}: the intake observation should be the longest"
        )
    return errors, warnings, stats


def main(argv: list[str]) -> int:
    slugs = argv or sorted(
        p.name for p in LONG.iterdir() if (p / "verite.json").exists()
    )
    failed = False
    for slug in slugs:
        errors, warnings, stats = check(slug)
        print(f"{slug}: {json.dumps(stats, ensure_ascii=False)}")
        for w in warnings:
            print(f"  warning: {w}")
        for e in errors:
            print(f"  ERROR: {e}")
        failed |= bool(errors)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
