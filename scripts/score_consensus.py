"""Score consensus runs on the fictional dossiers, against verite.json.

A consensus run (``run-frise.ts --readers=… --arbiter=…``) holds, on the same
observations, the consensus frise, each reader's own frise and their union
without arbiter: all are scored here, with the cost of each step.

    uv run python scripts/score_consensus.py data/processed/frise/consensus/<run> […]
"""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path

from addictoscope.frise_eval import score_run

ROOT = Path(__file__).resolve().parent.parent
DOSSIERS = ROOT / "data" / "anonymized" / "dossiers"


def score(folder: Path) -> None:
    found: dict[str, int] = defaultdict(int)
    produced: dict[str, int] = defaultdict(int)
    expected = 0
    cost: dict[str, float] = defaultdict(float)
    stats: dict[str, int] = defaultdict(int)
    done = 0
    for f in sorted(folder.glob("*.json")):
        run = json.loads(f.read_text(encoding="utf8"))
        if "timeline" not in run:
            print(f"{f.stem}: failed")
            continue
        verite = json.loads(
            (DOSSIERS / f.stem / "verite.json").read_text(encoding="utf8")
        )
        done += 1
        variants = {"consensus": run["timeline"]} | {
            r["model"]: r["timeline"] for r in run.get("readings", [])
        }
        for name, timeline in variants.items():
            s = score_run({**run, "timeline": timeline}, verite, DOSSIERS / f.stem)
            found[name] += s["status"]["found"]
            produced[name] += s["produced"]
        expected += len(verite["timeline"])
        for k, v in run["usage"].get("by", {}).items():
            cost[k] += v
        for k, v in run.get("consensus", {}).items():
            stats[k] += v
    print(f"## {folder.name} ({done} dossiers, {expected} événements attendus)\n")
    print("| Frise | Rappel | Événements produits |")
    print("|---|---|---|")
    for name, k in found.items():
        print(
            f"| {name} | {k}/{expected} ({100 * k / max(expected, 1):.0f} %) | {produced[name]} |"
        )
    print(
        "\nCoût de l'étape frise : "
        + ", ".join(f"{k} {v:.3f} $" for k, v in cost.items())
        + f" ; total {sum(cost.values()):.3f} $"
    )
    print("Consensus : " + ", ".join(f"{k} {v}" for k, v in stats.items()) + "\n")


if __name__ == "__main__":
    for a in sys.argv[1:]:
        score(Path(a))
