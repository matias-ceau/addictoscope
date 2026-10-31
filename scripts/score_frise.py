"""Score the frises of the fictional dossiers against their verite.json.

Reads the runs saved by ``web/scripts/run-frise.ts`` (one folder per run,
``data/processed/frise/run*/<dossier>.json``), prints a summary and writes
``data/processed/frise/rapport.md``.

    uv run python scripts/score_frise.py
    uv run python scripts/score_frise.py data/processed/frise/run1
"""
from __future__ import annotations

import json
import statistics
import sys
from pathlib import Path

from addictoscope.frise_eval import score_run

ROOT = Path(__file__).resolve().parent.parent
DOSSIERS = ROOT / "data" / "anonymized" / "dossiers"
FRISE = ROOT / "data" / "processed" / "frise"

STATUS_FR = {"found": "trouvé", "misdated": "mal daté", "other_track": "autre piste", "missed": "manqué"}
CHECK_FR = {
    "start": "début compatible",
    "start_as_precise": "début aussi précis",
    "end": "fin compatible",
    "ongoing": "« en cours » juste",
    "mode": "mode d'usage juste",
    "source": "au moins une source attendue",
}
KIND_FR = {
    "substance_use": "Consommations",
    "psychiatric": "Psychopathologie",
    "somatic": "Somatique",
    "medication": "Médicaments",
    "therapeutic_psycho": "Prises en charge",
    "life_event": "Événements de vie",
}


def pct(n: float, d: float) -> str:
    return f"{100 * n / d:.0f} %" if d else "–"


def spread(values: list[float], fmt="{:.0f}") -> str:
    if len(values) == 1:
        return fmt.format(values[0])
    return f"{fmt.format(statistics.mean(values))} ({fmt.format(min(values))}–{fmt.format(max(values))})"


def date_span(start, end, ongoing=False):
    if end:
        return f"{start} → {end}"
    return f"{start} →" if ongoing else start


def main(argv: list[str]) -> None:
    run_dirs = [Path(a) for a in argv] or sorted(p for p in FRISE.glob("run*") if p.is_dir())
    if not run_dirs:
        sys.exit("No run found: run web/scripts/run-frise.ts first.")
    slugs = sorted(p.name for p in DOSSIERS.iterdir() if (p / "verite.json").exists())
    verite = {s: json.loads((DOSSIERS / s / "verite.json").read_text(encoding="utf8")) for s in slugs}

    scores: dict[str, list[dict]] = {s: [] for s in slugs}
    runs_meta: list[dict] = []
    for d in run_dirs:
        for s in slugs:
            f = d / f"{s}.json"
            if not f.exists():
                continue
            run = json.loads(f.read_text(encoding="utf8"))
            runs_meta.append({"run": d.name, "dossier": s, "model": run["model"], "ranAt": run["ranAt"], "usage": run.get("usage", {})})
            scores[s].append(score_run(run, verite[s], DOSSIERS / s) | {"run": d.name})

    models = sorted({m["model"] for m in runs_meta})
    cost = sum(m["usage"].get("cost", 0) for m in runs_meta)
    n_runs = len(run_dirs)
    out: list[str] = []
    w = out.append

    w("# Frise des dossiers fictifs, notée contre `verite.json`\n")
    w(f"- Modèle : {', '.join(models)} ; {n_runs} passage(s) par dossier ; coût total {cost:.2f} $.")
    w(f"- Dates des passages : {min(m['ranAt'] for m in runs_meta)[:10]} → {max(m['ranAt'] for m in runs_meta)[:10]}.")
    w("- Chemin de l'application : couche texte → détections automatiques acceptées telles quelles (à la place "
      "de la relecture humaine) → masquage → vérification → images des pages masquées → découpage → frise.")
    w("- Tolérance sur les dates selon la certitude attendue : exacte ±3 j, mois ±15 j, année : l'année, "
      "approximative ±1 an.")
    w("- « Trouvé » = même piste, même libellé (à la formulation près), début compatible. La précision est une "
      "borne basse : un événement « en plus » peut être vrai et absent de la vérité.\n")
    if n_runs > 1:
        w("Les nombres donnent la moyenne des passages, puis (min–max).\n")

    w("## Synthèse\n")
    w("| Dossier | Attendus | Trouvés | Mal datés | Autre piste | Manqués | Produits | Rappel | Précision (borne basse) | Observations rendues / attendues |")
    w("|---|---|---|---|---|---|---|---|---|---|")
    totals = {"expected": [], "found": [], "produced": [], "matched": []}
    for s in slugs:
        sc = scores[s]
        if not sc:
            continue
        st = lambda k: [x["status"][k] for x in sc]  # noqa: E731
        seg = [
            (sum(d["produced"] for d in x["segmentation"].values()), sum(d["expected"] for d in x["segmentation"].values()))
            for x in sc
        ]
        w(
            f"| `{s}` | {sc[0]['expected']} | {spread(st('found'))} | {spread(st('misdated'))} | {spread(st('other_track'))} "
            f"| {spread(st('missed'))} | {spread([x['produced'] for x in sc])} "
            f"| {spread([100 * x['recall'] for x in sc])} % | {spread([100 * x['precision_lower_bound'] for x in sc])} % "
            f"| {spread([a for a, _ in seg])}/{seg[0][1]} |"
        )
    for i in range(n_runs):
        per_run = [scores[s][i] for s in slugs if len(scores[s]) > i]
        totals["expected"].append(sum(x["expected"] for x in per_run))
        totals["found"].append(sum(x["status"]["found"] for x in per_run))
        totals["produced"].append(sum(x["produced"] for x in per_run))
    recall = [100 * f / e for f, e in zip(totals["found"], totals["expected"])]
    prec = [100 * f / p if p else 0 for f, p in zip(totals["found"], totals["produced"])]
    w(f"| **Total** | {totals['expected'][0]} | {spread(totals['found'])} | | | | {spread(totals['produced'])} "
      f"| {spread(recall)} % | {spread(prec)} % | |\n")

    w("## Exactitude des événements trouvés\n")
    scored = [s for s in slugs if scores[s]]
    w("| Contrôle | " + " | ".join(f"`{s}`" for s in scored) + " | Total |")
    w("|---|" + "---|" * (len(scored) + 1))
    for key, label in CHECK_FR.items():
        if key == "start":
            continue  # always true: a found event has a compatible start by definition
        cells, tot_n, tot_d = [], 0, 0
        for s in scored:
            n = sum(x["checks"].get(key, (0, 0))[0] for x in scores[s])
            d = sum(x["checks"].get(key, (0, 0))[1] for x in scores[s])
            tot_n, tot_d = tot_n + n, tot_d + d
            cells.append(pct(n, d))
        w(f"| {label} | " + " | ".join(cells) + f" | {pct(tot_n, tot_d)} ({tot_n}/{tot_d}) |")
    w("")

    w("## Rappel par piste (tous dossiers, tous passages)\n")
    w("| Piste | Trouvés / attendus | Rappel |")
    w("|---|---|---|")
    by_kind: dict[str, list[int]] = {}
    for s in slugs:
        for x in scores[s]:
            for k, (f, n) in x["by_kind"].items():
                by_kind.setdefault(k, [0, 0])
                by_kind[k][0] += f
                by_kind[k][1] += n
    for k in KIND_FR:
        if k in by_kind:
            f, n = by_kind[k]
            w(f"| {KIND_FR[k]} | {f}/{n} | {pct(f, n)} |")
    w("")

    w("## Validation par le code\n")
    w("Événements rendus par le modèle, puis écartés ou fusionnés par `assembleTimeline` "
      "(`web/src/notebook/timeline.ts`).\n")
    w("| Passage | Dossier | Rendus | Piste inconnue | Date illisible | Sans source connue | Fusionnés (doublons) | Gardés |")
    w("|---|---|---|---|---|---|---|---|")
    for s in slugs:
        for x in scores[s]:
            v = x["validation"]
            w(f"| {x['run']} | `{s}` | {v['raw']} | {v['bad_kind']} | {v['bad_start']} | {v['no_known_source']} "
              f"| {v['merged']} | {v['kept'] - v['merged']} |")
    w("")

    w("## Découpage en observations\n")
    w("| Passage | Document | Attendues | Rendues | Dates justes |")
    w("|---|---|---|---|---|")
    for s in slugs:
        for x in scores[s]:
            for doc, d in x["segmentation"].items():
                w(f"| {x['run']} | `{s}/{doc}.pdf` | {d['expected']} | {d['produced']} | {d['dates_right']}/{d['dated_expected']} |")
    w("")

    if n_runs > 1:
        w("## Stabilité d'un passage à l'autre\n")
        w("| Dossier | Trouvés à chaque passage | Parfois | Jamais |")
        w("|---|---|---|---|")
        for s in slugs:
            if not scores[s]:
                continue
            counts = [sum(x["matches"][i].status == "found" for x in scores[s]) for i in range(scores[s][0]["expected"])]
            k = len(scores[s])
            w(f"| `{s}` | {sum(c == k for c in counts)} | {sum(0 < c < k for c in counts)} | {sum(c == 0 for c in counts)} |")
        w("")

    w("## Détail par dossier\n")
    for s in slugs:
        if not scores[s]:
            continue
        k = len(scores[s])
        first = scores[s][0]
        w(f"### `{s}`\n")
        w(f"Statut au passage `{first['run']}`" + (f", et nombre de passages où l'événement est trouvé (sur {k})." if k > 1 else "."))
        w("")
        w("| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |" + (" Trouvé |" if k > 1 else ""))
        w("|---|---|---|---|---|---|" + ("---|" if k > 1 else ""))
        for i, m in enumerate(first["matches"]):
            e = m.expected
            got = ""
            if m.produced:
                p = m.produced
                got = f"{p.label} · {date_span(p.start, p.end, p.ongoing)}" + (f" · {p.mode}" if p.mode else "")
                bad = [CHECK_FR[c] for c, ok in m.checks.items() if ok is False and c != "start_as_precise"]
                if bad and m.status == "found":
                    got += " ⚠ " + ", ".join(bad)
            row = (f"| {KIND_FR[e['track']['kind']]} | {e['track']['label']} | {date_span(e['start'], e.get('end'), e.get('ongoing', False))} "
                   f"({e['certainty']}) | {e.get('mode') or ''} | {STATUS_FR[m.status]} | {got} |")
            if k > 1:
                row += f" {sum(x['matches'][i].status == 'found' for x in scores[s])}/{k} |"
            w(row)
        w("")
        if first["extras"]:
            w(f"En plus (passage `{first['run']}`), à relire : vrai mais absent de la vérité, ou erreur.\n")
            for p in first["extras"]:
                w(f"- {KIND_FR.get(p.kind, p.kind)} · **{p.label}** · {date_span(p.start, p.end, p.ongoing)}"
                  + (f" · {p.mode}" if p.mode else "") + f" — {p.note}")
            w("")

    report = "\n".join(out) + "\n"
    (FRISE / "rapport.md").write_text(report, encoding="utf8")

    print(f"{'dossier':20} {'attendus':>8} {'trouvés':>12} {'produits':>12} {'rappel':>12} {'précision':>12}")
    for s in slugs:
        sc = scores[s]
        if sc:
            print(f"{s:20} {sc[0]['expected']:>8} {spread([x['status']['found'] for x in sc]):>12} "
                  f"{spread([x['produced'] for x in sc]):>12} {spread([100 * x['recall'] for x in sc]):>10} % "
                  f"{spread([100 * x['precision_lower_bound'] for x in sc]):>10} %")
    print(f"report: {(FRISE / 'rapport.md').relative_to(ROOT)}")


if __name__ == "__main__":
    main(sys.argv[1:])
