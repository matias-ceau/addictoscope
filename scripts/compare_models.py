"""Compare models on the 14 fictional dossiers: quality against verite.json, cost, time.

Each run folder holds one ``web/scripts/run-frise.ts`` passage of one model
(``--out=bench/<model>``). The reference passage of the default model is
``age1`` (same prompts). Writes ``data/processed/frise/comparaison-modeles.md``
and ``.json``.

    uv run python scripts/compare_models.py
    uv run python scripts/compare_models.py data/processed/frise/age1 data/processed/frise/bench/*
"""

from __future__ import annotations

import json
import re
import statistics
import sys
from collections.abc import Callable
from pathlib import Path
from typing import Any

from addictoscope.frise_eval import score_run

ROOT = Path(__file__).resolve().parent.parent
DOSSIERS = ROOT / "data" / "anonymized" / "dossiers"
FRISE = ROOT / "data" / "processed" / "frise"

# Expected events told by an age ("à 14 ans", "à l'adolescence").
AGE = re.compile(
    r"\b(?:à|a|vers|dès|avant|depuis l'âge de|âge de)\s+\d{1,2}\s*ans\b|\b\d{1,2}\s*ans\b(?! (?:de|d'))|adolescen|enfance|jeune adulte",
    re.IGNORECASE,
)
# Mean cost of one real dossier with the reference model (6 dossiers, $7.00,
# 04/11/2026): real dossiers are 5 to 10 times longer than the fictional ones.
REAL_DOSSIER_REFERENCE_COST = 7.00 / 6


def score_folder(
    folder: Path, slugs: list[str], verite: dict[str, dict]
) -> dict[str, Any]:
    out: dict[str, Any] = {
        "model": None,
        "ok": 0,
        "failed": [],
        "expected": 0,
        "expected_ok": 0,
        "found": 0,
        "produced": 0,
        "matched": 0,
        "age_expected": 0,
        "age_found": 0,
        "end_ok": 0,
        "end_n": 0,
        "obs_produced": 0,
        "obs_expected": 0,
        "obs_dates_right": 0,
        "obs_dated_expected": 0,
        "cost": 0.0,
        "elapsed": [],
        "per_dossier": {},
    }
    for s in slugs:
        f = folder / f"{s}.json"
        n_expected = len(verite[s]["timeline"])
        out["expected"] += n_expected
        out["age_expected"] += sum(
            bool(AGE.search(e.get("note", ""))) for e in verite[s]["timeline"]
        )
        if not f.exists():
            out["failed"].append(s)
            continue
        run = json.loads(f.read_text(encoding="utf8"))
        out["model"] = run.get("model", out["model"])
        if run.get("segmentModel"):
            out["model"] = f"{out['model']} (découpage : {run['segmentModel']})"
        if run.get("textOnly"):
            out["model"] = f"{out['model']} (texte seul, sans images)"
        out["cost"] += run.get("usage", {}).get("cost", 0) or 0
        if run.get("elapsedMs"):
            out["elapsed"].append(run["elapsedMs"] / 1000)
        if run.get("error") or "timeline" not in run:
            out["failed"].append(s)
            continue
        out["ok"] += 1
        out["expected_ok"] += n_expected
        sc = score_run(run, verite[s], DOSSIERS / s)
        out["per_dossier"][s] = {"found": sc["status"]["found"], "expected": n_expected}
        out["found"] += sc["status"]["found"]
        out["produced"] += sc["produced"]
        out["matched"] += sum(
            m.produced is not None and m.status == "found" for m in sc["matches"]
        )
        out["age_found"] += sum(
            m.status == "found" and bool(AGE.search(m.expected.get("note", "")))
            for m in sc["matches"]
        )
        ok, n = sc["checks"].get("end", (0, 0))
        out["end_ok"] += ok
        out["end_n"] += n
        for d in sc["segmentation"].values():
            out["obs_produced"] += d["produced"]
            out["obs_expected"] += d["expected"]
            out["obs_dates_right"] += d["dates_right"]
            out["obs_dated_expected"] += d["dated_expected"]
    return out


def pct(n: float, d: float) -> str:
    return f"{100 * n / d:.0f} %" if d else "–"


def opt(value: float | None, fmt: Callable[[float], str], missing: str = "–") -> str:
    return missing if value is None else fmt(value)


def main(argv: list[str]) -> None:
    folders = [Path(a) for a in argv] or [
        FRISE / "age1",
        *sorted(p for p in (FRISE / "bench").iterdir() if p.is_dir()),
    ]
    slugs = sorted(p.name for p in DOSSIERS.iterdir() if (p / "verite.json").exists())
    verite = {
        s: json.loads((DOSSIERS / s / "verite.json").read_text(encoding="utf8"))
        for s in slugs
    }

    rows: list[dict[str, Any]] = [
        score_folder(f, slugs, verite) | {"run": f.name} for f in folders
    ]
    rows = [r for r in rows if r["model"]]
    ref = next((r for r in rows if r["run"] == "age1"), None)
    ref_cost = ref["cost"] / max(ref["ok"], 1) if ref else None
    rows.sort(key=lambda r: (-r["found"], r["cost"]))

    summary = []
    for r in rows:
        # Some providers do not report a cost: unknown rather than free.
        per = r["cost"] / max(r["ok"], 1) if r["cost"] > 0 else None
        summary.append(
            {
                "model": r["model"],
                "run": r["run"],
                "dossiersOk": r["ok"],
                "failed": r["failed"],
                "recall": r["found"] / r["expected"],
                "recallOnSucceeded": r["found"] / r["expected_ok"]
                if r["expected_ok"]
                else 0,
                "found": r["found"],
                "expected": r["expected"],
                "precisionLowerBound": r["matched"] / r["produced"]
                if r["produced"]
                else 0,
                "ageFound": r["age_found"],
                "ageExpected": r["age_expected"],
                "endCompatible": r["end_ok"] / r["end_n"] if r["end_n"] else None,
                "observations": [r["obs_produced"], r["obs_expected"]],
                "observationDatesRight": [
                    r["obs_dates_right"],
                    r["obs_dated_expected"],
                ],
                "costTotal": round(r["cost"], 4),
                "costPerDossier": round(per, 4) if per is not None else None,
                "costPerRealDossier": round(
                    REAL_DOSSIER_REFERENCE_COST * per / ref_cost, 3
                )
                if ref_cost and per is not None
                else None,
                "secondsPerDossier": round(statistics.mean(r["elapsed"]))
                if r["elapsed"]
                else None,
                "perDossier": r["per_dossier"],
            }
        )

    w: list[str] = []
    w.append("# Comparaison de modèles sur les 14 dossiers fictifs\n")
    w.append(
        "Même chemin que l'application (masquage, vérification, images des pages masquées, découpage, frise), "
        "même prompt, un seul passage par modèle ; tous les appels passent par OpenRouter avec zéro conservation "
        "(`provider.zdr`, `data_collection: deny`). Notation contre `verite.json` (`scripts/score_frise.py`). "
        "Un dossier en échec compte pour 0 événement trouvé.\n"
    )
    w.append(
        "Coût d'un dossier réel : estimé par proportion à partir du coût du modèle de référence sur les 6 dossiers "
        f"réels ({REAL_DOSSIER_REFERENCE_COST:.2f} $ par dossier, 04/11/2026).\n"
    )
    w.append(
        "| Modèle | Dossiers | Rappel | Rappel (dossiers réussis) | Précision (borne basse) | Antécédents par l'âge | Fins compatibles "
        "| Observations (dates justes) | Coût / dossier fictif | ≈ Coût / dossier réel | Durée / dossier |"
    )
    w.append("|---|---|---|---|---|---|---|---|---|---|---|")
    for s in summary:
        obs_ok, obs_n = s["observationDatesRight"]
        w.append(
            f"| `{s['model']}` | {s['dossiersOk']}/14 | {pct(s['found'], s['expected'])} ({s['found']}/{s['expected']}) "
            f"| {100 * s['recallOnSucceeded']:.0f} % "
            f"| {100 * s['precisionLowerBound']:.0f} % | {s['ageFound']}/{s['ageExpected']} "
            f"| {opt(s['endCompatible'], lambda v: f'{100 * v:.0f} %')} "
            f"| {pct(obs_ok, obs_n)} | {opt(s['costPerDossier'], lambda v: f'{v:.3f} $', 'non rapporté')} "
            f"| {opt(s['costPerRealDossier'], lambda v: f'{v:.2f} $')} "
            f"| {opt(s['secondsPerDossier'], lambda v: f'{v} s')} |"
        )
    w.append(
        "\nNotes : un seul passage par modèle (DeepSeek : deux, 81 % chaque fois sur les dossiers réussis), l'écart d'un passage à l'autre "
        "est de quelques points. Les modèles qui raisonnent (DeepSeek, Luna Pro) produisent beaucoup de jetons de "
        "sortie, d'où leur coût. Le compte utilise des clés fournisseur (BYOK) pour certains fournisseurs : le coût "
        "compté est alors le coût amont. Qwen3 VL (plus de 6 minutes par dossier) a été arrêté ; Mistral Medium "
        "n'est servi que par Mistral, où la clé fournisseur enregistrée est refusée."
    )
    failed = [s for s in summary if s["failed"]]
    if failed:
        w.append(
            "\nÉchecs : "
            + " ; ".join(f"`{s['model']}` : {', '.join(s['failed'])}" for s in failed)
            + "."
        )
    (FRISE / "comparaison-modeles.md").write_text("\n".join(w) + "\n", encoding="utf8")
    (FRISE / "comparaison-modeles.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf8"
    )
    print("\n".join(w))


if __name__ == "__main__":
    main(sys.argv[1:])
