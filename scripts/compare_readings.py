"""Ways of reading the long fictional dossiers, side by side.

    uv run python scripts/compare_readings.py data/processed/frise/longs/regroupe2 data/processed/frise/longs/relu …

One row per run folder, summed over the dossiers it holds: expected events
found (recall), events produced and the share that match an expected one
(precision, a lower bound), and, among the events found, how many have an end
and an "en cours" that agree with the expected frise. A run made with
--proofread also gets a row for the frise before it was read again.
Written to data/processed/frise/comparaison-lectures.md.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from addictoscope.frise_eval import score_run

ROOT = Path(__file__).resolve().parent.parent
DOSSIERS = ROOT / "data" / "anonymized" / "dossiers-longs"
OUT = ROOT / "data" / "processed" / "frise" / "comparaison-lectures.md"


def pct(n: int, d: int) -> str:
    return f"{n}/{d} ({round(100 * n / d)} %)" if d else "—"


def total(folder: Path, key: str = "timeline") -> dict[str, int] | None:
    t = dict.fromkeys(
        (
            "dossiers",
            "found",
            "expected",
            "produced",
            "matched",
            "end",
            "end_n",
            "ongoing",
            "ongoing_n",
            "tracks",
        ),
        0,
    )
    for d in sorted(p for p in DOSSIERS.iterdir() if (p / "verite.json").exists()):
        f = folder / f"{d.name}.json"
        if not f.exists():
            continue
        run = json.loads(f.read_text(encoding="utf8"))
        if key not in run:
            return None
        run = {
            k: v
            for k, v in run.items()
            if k not in ("timelineRead", "timelineUnchecked")
        } | {"timeline": run[key]}
        s = score_run(
            run, json.loads((d / "verite.json").read_text(encoding="utf8")), d
        )
        t["dossiers"] += 1
        t["found"] += s["status"]["found"]
        t["expected"] += s["expected"]
        t["produced"] += s["produced"]
        t["matched"] += round(s["precision_lower_bound"] * s["produced"])
        t["tracks"] += len(run["timeline"]["tracks"])
        for k in ("end", "ongoing"):
            a, b = s["checks"].get(k, (0, 0))
            t[k] += a
            t[k + "_n"] += b
    return t if t["dossiers"] else None


def main() -> None:
    rows = []
    for arg in sys.argv[1:]:
        folder = Path(arg)
        before = total(folder, "timelineUnchecked")
        if before:
            rows.append((f"{folder.name} (avant relecture)", before))
        t = total(folder)
        if t:
            rows.append((folder.name, t))
    lines = [
        "| Lecture | Dossiers | Rappel | Lignes | Événements | Précision (borne basse) | Fin compatible | « En cours » juste |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for name, t in rows:
        lines.append(
            f"| {name} | {t['dossiers']} | {pct(t['found'], t['expected'])} | {t['tracks']} | {t['produced']} | "
            f"{pct(t['matched'], t['produced'])} | {pct(t['end'], t['end_n'])} | {pct(t['ongoing'], t['ongoing_n'])} |"
        )
    lines += [
        "",
        "Fin compatible et « en cours » juste : parmi les événements attendus retrouvés. La précision est une borne basse : un événement en plus peut être vrai et absent de la frise attendue.",
    ]
    OUT.write_text("\n".join(lines) + "\n", encoding="utf8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
