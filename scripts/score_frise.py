"""Score the frises of the fictional dossiers against their verite.json.

Reads the runs saved by ``web/scripts/run-frise.ts`` (one folder per run,
``data/processed/frise/run*/<dossier>.json``), prints a summary and writes
``data/processed/frise/rapport.md``.

    uv run python scripts/score_frise.py
    uv run python scripts/score_frise.py data/processed/frise/run1

The long dossiers (``data/anonymized/dossiers-longs``) have their own report,
``rapport-longs.md``, with the recall split by where each expected event
comes from (told at intake, lived during the follow-up, revealed late):

    uv run python scripts/score_frise.py --root=dossiers-longs data/processed/frise/longs/regroupe1

A run regrouped after its reading (``run-frise.ts --consolidate``) is scored
twice, as read and as regrouped: section « Regroupement des doublons ».
"""

from __future__ import annotations

import json
import statistics
import sys
from collections.abc import Sequence
from pathlib import Path

from addictoscope.frise_eval import (
    CHARS_PER_COMPLETION_TOKEN,
    CHARS_PER_PROMPT_TOKEN,
    estimated_cost,
    score_run,
)

ROOT = Path(__file__).resolve().parent.parent
FRISE = ROOT / "data" / "processed" / "frise"

# Dollars per million tokens (prompt, completion), as billed on the paid runs.
PRICES = {"anthropic/claude-sonnet-5.5": (2.0, 10.0)}
ORIGIN_FR = {
    "intake": "Rapporté à l'entrée (antécédents)",
    "follow_up": "Vécu pendant le suivi",
    "late": "Révélé tard (passé appris en cours de suivi)",
}

STATUS_FR = {
    "found": "trouvé",
    "misdated": "mal daté",
    "other_track": "autre piste",
    "missed": "manqué",
}
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


def spread(values: Sequence[float], fmt: str = "{:.0f}") -> str:
    if len(values) == 1:
        return fmt.format(values[0])
    return f"{fmt.format(statistics.mean(values))} ({fmt.format(min(values))}–{fmt.format(max(values))})"


def date_span(start, end, ongoing=False):
    if end:
        return f"{start} → {end}"
    return f"{start} →" if ongoing else start


def main(argv: list[str]) -> None:
    options = dict(a[2:].split("=", 1) for a in argv if a.startswith("--") and "=" in a)
    root = options.get("root", "dossiers")
    DOSSIERS = ROOT / "data" / "anonymized" / root
    report_name = options.get("report") or (
        "rapport.md"
        if root == "dossiers"
        else f"rapport-{root.removeprefix('dossiers-')}.md"
    )
    run_dirs = [Path(a) for a in argv if not a.startswith("--")] or sorted(
        p for p in FRISE.glob("run*") if p.is_dir()
    )
    if not run_dirs:
        sys.exit("No run found: run web/scripts/run-frise.ts first.")
    slugs = sorted(p.name for p in DOSSIERS.iterdir() if (p / "verite.json").exists())
    verite = {
        s: json.loads((DOSSIERS / s / "verite.json").read_text(encoding="utf8"))
        for s in slugs
    }

    scores: dict[str, list[dict]] = {s: [] for s in slugs}
    runs_meta: list[dict] = []
    for d in run_dirs:
        for s in slugs:
            f = d / f"{s}.json"
            if not f.exists():
                continue
            run = json.loads(f.read_text(encoding="utf8"))
            runs_meta.append(
                {
                    "run": d.name,
                    "dossier": s,
                    "model": run["model"],
                    "ranAt": run["ranAt"],
                    "usage": run.get("usage", {}),
                    "docs": run.get("docs", {}),
                    "observations": len(run["observations"]),
                    "transport": run.get("transport"),
                    "segmentedBy": run.get("segmentedBy", {}),
                }
            )
            scores[s].append(score_run(run, verite[s], DOSSIERS / s) | {"run": d.name})

    models = sorted({m["model"] for m in runs_meta})
    cost = sum(m["usage"].get("cost", 0) for m in runs_meta)
    n_runs = max(len(v) for v in scores.values())
    # Dossiers added later may have fewer runs than the first ones.
    runs_per_dossier = sorted({len(v) for v in scores.values() if v}, reverse=True)
    uneven = len(runs_per_dossier) > 1
    out: list[str] = []
    w = out.append

    from_files = [m for m in runs_meta if m["transport"] == "files"]
    by_rules = any("rules" in m["segmentedBy"].values() for m in runs_meta)
    w(
        f"# Frise des dossiers fictifs{'' if root == 'dossiers' else ' longs'}, notée contre `verite.json`\n"
    )
    passes = " ou ".join(str(k) for k in runs_per_dossier)
    if from_files:
        w(
            f"- Demandes de l'application ({', '.join(models)}) écrites dans des fichiers et répondues par des "
            f"sous-agents, une demande par sous-agent, sans rien d'autre sous les yeux ; {passes} passage(s) par dossier ; "
            "aucun appel payant."
        )
    else:
        w(
            f"- Modèle : {', '.join(models)} ; {passes} passage(s) par dossier ; coût total {cost:.2f} $."
        )
    w(
        f"- Dates des passages : {min(m['ranAt'] for m in runs_meta)[:10]} → {max(m['ranAt'] for m in runs_meta)[:10]}."
    )
    if by_rules:
        w(
            "- Chemin de l'application : couche texte → détections automatiques acceptées telles quelles → masquage → "
            "vérification → identifiants restés lisibles masqués à la main (à la place de la relecture humaine, comptés "
            "plus bas) → découpage par règles quand la mise en page est reconnue, par le modèle sinon → frise."
        )
    else:
        w(
            "- Chemin de l'application : couche texte → détections automatiques acceptées telles quelles (à la place "
            "de la relecture humaine) → masquage → vérification → images des pages masquées → découpage → frise."
        )
    w(
        "- Tolérance sur les dates selon la certitude attendue : exacte ±3 j, mois ±15 j, année : l'année, "
        "approximative ±1 an."
    )
    w(
        "- « Trouvé » = même piste, même libellé (à la formulation près), début compatible. La précision est une "
        "borne basse : un événement « en plus » peut être vrai et absent de la vérité."
    )
    w(
        "- Sur une piste de consommation, une molécule opioïde vaut pour sa classe (« Oxycodone » attendu, "
        "« Opioïdes » rendu) ; jamais sur une piste de médicament."
    )
    regrouped = any(x["read"] for s in slugs for x in scores[s])
    if regrouped:
        w(
            "- Les frises lues en plusieurs lots sont regroupées par une demande de plus (sans texte d'observation) : "
            "les tableaux notent la frise regroupée, la section « Regroupement des doublons » la compare à la frise "
            "telle que lue. Une piste regroupée répond à tous les intitulés sous lesquels elle a été lue."
        )
    w("")
    if n_runs > 1:
        w("Les nombres donnent la moyenne des passages, puis (min–max).\n")

    w("## Synthèse\n")
    w(
        "| Dossier | Attendus | Trouvés | Mal datés | Autre piste | Manqués | Produits | Rappel | Précision (borne basse) | Observations rendues / attendues |"
    )
    w("|---|---|---|---|---|---|---|---|---|---|")
    totals = {"expected": [], "found": [], "produced": [], "matched": []}
    for s in slugs:
        sc = scores[s]
        if not sc:
            continue
        st = lambda k, sc=sc: [x["status"][k] for x in sc]
        seg = [
            (
                sum(d["produced"] for d in x["segmentation"].values()),
                sum(d["expected"] for d in x["segmentation"].values()),
            )
            for x in sc
        ]
        w(
            f"| `{s}` | {sc[0]['expected']} | {spread(st('found'))} | {spread(st('misdated'))} | {spread(st('other_track'))} "
            f"| {spread(st('missed'))} | {spread([x['produced'] for x in sc])} "
            f"| {spread([100 * x['recall'] for x in sc])} % | {spread([100 * x['precision_lower_bound'] for x in sc])} % "
            f"| {spread([a for a, _ in seg])}/{seg[0][1]} |"
        )
    if uneven:
        # Pool every run of every dossier: one figure, each run weighted by its events.
        pooled = [x for s in slugs for x in scores[s]]
        found = sum(x["status"]["found"] for x in pooled)
        expected = sum(x["expected"] for x in pooled)
        produced = sum(x["produced"] for x in pooled)
        w(
            f"| **Total** (tous passages réunis) | {expected} | {found} | | | | {produced} "
            f"| {pct(found, expected)} | {pct(found, produced)} | |\n"
        )
    else:
        for i in range(n_runs):
            per_run = [scores[s][i] for s in slugs if len(scores[s]) > i]
            totals["expected"].append(sum(x["expected"] for x in per_run))
            totals["found"].append(sum(x["status"]["found"] for x in per_run))
            totals["produced"].append(sum(x["produced"] for x in per_run))
        recall = [100 * f / e for f, e in zip(totals["found"], totals["expected"])]
        prec = [
            100 * f / p if p else 0 for f, p in zip(totals["found"], totals["produced"])
        ]
        w(
            f"| **Total** | {totals['expected'][0]} | {spread(totals['found'])} | | | | {spread(totals['produced'])} "
            f"| {spread(recall)} % | {spread(prec)} % | |\n"
        )

    if regrouped:
        usage_of = {(m["run"], m["dossier"]): m for m in runs_meta}
        w("## Regroupement des doublons\n")
        w(
            "Les lots sont lus indépendamment et le dossier raconte lui-même plusieurs fois le passé : le même fait "
            "revient sous des intitulés et des dates qui varient. Une demande de plus montre au modèle les pistes et "
            "les événements trouvés, sans aucun texte d'observation, et lui demande lesquels désignent la même chose ; "
            "le code fusionne après contrôle (`web/src/notebook/consolidate.ts`). Chaque case : frise lue → frise "
            "regroupée.\n"
        )
        w(
            "| Passage | Dossier | Lots | Pistes attendues | Pistes | Événements | Trouvés | dont la date est sous la barre "
            "| Précision (borne basse) | Fin compatible | « En cours » juste | Dates discordantes signalées | Coût estimé de la demande |"
        )
        w("|---|---|---|---|---|---|---|---|---|---|---|---|---|")
        tot = {
            k: 0
            for k in (
                "exp_tracks",
                "t0",
                "t1",
                "e0",
                "e1",
                "f0",
                "f1",
                "under",
                "exp",
                "disc",
            )
        }
        tot_checks = {k: [0, 0, 0, 0] for k in ("end", "ongoing")}
        tot_cost = 0.0
        arrow = lambda a, b: f"{a} → {b}"
        for s in slugs:
            for x in scores[s]:
                r = x["read"]
                if not r:
                    continue
                c = x["consolidation"] or {}
                m = usage_of[(x["run"], s)]
                chars = m["usage"].get("charsBy", {}).get("regroupement")
                price = PRICES.get(m["model"])
                est = (
                    estimated_cost(chars["promptChars"], chars["answerChars"], *price)
                    if chars and price
                    else None
                )
                under = (x["found_with_mentions"] or x["status"]["found"]) - x[
                    "status"
                ]["found"]
                cells = []
                for k in ("end", "ongoing"):
                    (a, b), (a2, b2) = (
                        r["checks"].get(k, (0, 0)),
                        x["checks"].get(k, (0, 0)),
                    )
                    cells.append(arrow(f"{a}/{b}", f"{a2}/{b2}"))
                    for i, v in enumerate((a, b, a2, b2)):
                        tot_checks[k][i] += v
                failed = (
                    " (échec : frise laissée telle que lue)" if c.get("failed") else ""
                )
                w(
                    f"| {x['run']} | `{s}` | {c.get('lots', '–')}{failed} | {x['expected_tracks']} | {arrow(r['tracks'], x['tracks'])} "
                    f"| {arrow(r['produced'], x['produced'])} | {arrow(r['status']['found'], x['status']['found'])}/{x['expected']} "
                    f"| {under} | {arrow(pct(r['precision_lower_bound'], 1), pct(x['precision_lower_bound'], 1))} "
                    f"| {cells[0]} | {cells[1]} | {c.get('discordant', '–')} | {f'{est:.2f} $' if est is not None else '–'} |"
                )
                for k, v in (
                    ("exp_tracks", x["expected_tracks"]),
                    ("t0", r["tracks"]),
                    ("t1", x["tracks"]),
                    ("e0", r["produced"]),
                    ("e1", x["produced"]),
                    ("f0", r["status"]["found"]),
                    ("f1", x["status"]["found"]),
                    ("under", under),
                    ("exp", x["expected"]),
                    ("disc", c.get("discordant", 0)),
                ):
                    tot[k] += v
                tot_cost += est or 0
        end, ong = tot_checks["end"], tot_checks["ongoing"]
        w(
            f"| **Total** | | | {tot['exp_tracks']} | {arrow(tot['t0'], tot['t1'])} | {arrow(tot['e0'], tot['e1'])} "
            f"| {arrow(tot['f0'], tot['f1'])}/{tot['exp']} ({arrow(pct(tot['f0'], tot['exp']), pct(tot['f1'], tot['exp']))}) "
            f"| {tot['under']} | {arrow(pct(tot['f0'], tot['e0']), pct(tot['f1'], tot['e1']))} "
            f"| {arrow(f'{end[0]}/{end[1]}', f'{end[2]}/{end[3]}')} | {arrow(f'{ong[0]}/{ong[1]}', f'{ong[2]}/{ong[3]}')} "
            f"| {tot['disc']} | {tot_cost:.2f} $ |\n"
        )
        w(
            "« Dont la date est sous la barre » : événements attendus qui ne sont plus « trouvés » parce que la barre "
            "regroupée commence à une autre date (le début d'un trouble et son diagnostic des années plus tard, par "
            "exemple), mais dont la date attendue figure parmi les mentions regroupées, affichées au survol. "
            "Les autres pertes : deux faits proches fusionnés à tort (une séparation et le divorce qui la suit), et "
            "quelques appariements qui n'étaient justes que par chance dans la frise lue.\n"
        )

    if any(x["by_origin"] for s in slugs for x in scores[s]):
        w("## Rappel selon l'origine de l'événement\n")
        w(
            "Un dossier long raconte le passé deux fois : à l'observation d'entrée, puis au fil du suivi, où des "
            "éléments du passé ne sont dits ou retrouvés que tard.\n"
        )
        scored_o = [s for s in slugs if scores[s]]
        w("| Origine | " + " | ".join(f"`{s}`" for s in scored_o) + " | Total |")
        w("|---|" + "---|" * (len(scored_o) + 1))
        for key, label in ORIGIN_FR.items():
            cells, tot_f, tot_n = [], 0, 0
            for s in scored_o:
                f = sum(x["by_origin"].get(key, [0, 0])[0] for x in scores[s])
                n = sum(x["by_origin"].get(key, [0, 0])[1] for x in scores[s])
                tot_f, tot_n = tot_f + f, tot_n + n
                cells.append(f"{f}/{n}" if n else "–")
            w(
                f"| {label} | "
                + " | ".join(cells)
                + f" | {tot_f}/{tot_n} ({pct(tot_f, tot_n)}) |"
            )
        w("")

    if from_files or by_rules:
        w("## Volume, relecture simulée et coût\n")
        if from_files:
            w(
                f"Coût estimé d'appels payants équivalents : caractères échangés ÷ {CHARS_PER_PROMPT_TOKEN:g} par jeton "
                f"de demande (valeur usuelle pour du français) et ÷ {CHARS_PER_COMPLETION_TOKEN:g} par jeton de réponse "
                "(mesuré sur les passages payants des dossiers courts), aux prix facturés lors de ces passages. "
                "Une estimation, pas une facture.\n"
            )
        w(
            "| Passage | Dossier | Pages | Observations | Découpage | Identifiants laissés par les règles (masqués à la main) "
            "| Demandes | Caractères envoyés | Caractères reçus | Coût estimé |"
        )
        w("|---|---|---|---|---|---|---|---|---|---|")
        tot = {
            "pages": 0,
            "obs": 0,
            "calls": 0,
            "prompt": 0,
            "answer": 0,
            "cost": 0.0,
            "left": 0,
        }
        for m in runs_meta:
            u = m["usage"]
            pages = sum(d.get("pages", 0) for d in m["docs"].values())
            left = sum(d.get("leftByRules", 0) for d in m["docs"].values())
            how = (
                ", ".join(
                    f"{doc} : {'règles' if by == 'rules' else 'modèle'}"
                    for doc, by in sorted(m["segmentedBy"].items())
                )
                or "modèle"
            )
            price = PRICES.get(m["model"])
            est = (
                estimated_cost(u.get("promptChars", 0), u.get("answerChars", 0), *price)
                if price and "promptChars" in u
                else None
            )
            w(
                f"| {m['run']} | `{m['dossier']}` | {pages} | {m['observations']} | {how} | {left} | {u.get('calls', 0)} "
                f"| {u.get('promptChars', '–')} | {u.get('answerChars', '–')} | {f'{est:.2f} $' if est is not None else '–'} |"
            )
            tot["pages"] += pages
            tot["obs"] += m["observations"]
            tot["calls"] += u.get("calls", 0)
            tot["prompt"] += u.get("promptChars", 0)
            tot["answer"] += u.get("answerChars", 0)
            tot["cost"] += est or 0
            tot["left"] += left
        w(
            f"| **Total** | | {tot['pages']} | {tot['obs']} | | {tot['left']} | {tot['calls']} | {tot['prompt']} | {tot['answer']} "
            f"| {tot['cost']:.2f} $ ({tot['cost'] / len(runs_meta):.2f} $ par dossier) |\n"
        )

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
        w(
            f"| {label} | "
            + " | ".join(cells)
            + f" | {pct(tot_n, tot_d)} ({tot_n}/{tot_d}) |"
        )
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
    for k, label in KIND_FR.items():
        if k in by_kind:
            f, n = by_kind[k]
            w(f"| {label} | {f}/{n} | {pct(f, n)} |")
    w("")

    w("## Validation par le code\n")
    w(
        "Événements rendus par le modèle, puis écartés ou fusionnés par `assembleTimeline` "
        "(`web/src/notebook/timeline.ts`), avant tout regroupement. Un événement sans début dans le texte est gardé "
        "s'il a une fin ou s'il est en cours : il est placé à la première observation datée qui le mentionne, et "
        "signalé « début non précisé ».\n"
    )
    w(
        "| Passage | Dossier | Rendus | Piste inconnue | Ni date ni âge | Sans source connue | Fusionnés (même événement lu dans deux lots) "
        "| Gardés | dont datés par l'âge | dont placés à la première mention |"
    )
    w("|---|---|---|---|---|---|---|---|---|---|")
    for s in slugs:
        for x in scores[s]:
            v = x["validation"]
            w(
                f"| {x['run']} | `{s}` | {v['raw']} | {v['bad_kind']} | {v['bad_start']} | {v['no_known_source']} "
                f"| {v['merged']} | {v['kept'] - v['merged']} | {v['by_age']} | {v['by_mention']} |"
            )
    w("")

    w("## Découpage en observations\n")
    w("| Passage | Document | Attendues | Rendues | Dates justes |")
    w("|---|---|---|---|---|")
    for s in slugs:
        for x in scores[s]:
            for doc, d in x["segmentation"].items():
                w(
                    f"| {x['run']} | `{s}/{doc}.pdf` | {d['expected']} | {d['produced']} | {d['dates_right']}/{d['dated_expected']} |"
                )
    w("")

    if n_runs > 1:
        w("## Stabilité d'un passage à l'autre\n")
        w("| Dossier | Trouvés à chaque passage | Parfois | Jamais |")
        w("|---|---|---|---|")
        for s in slugs:
            if len(scores[s]) < 2:
                continue
            counts = [
                sum(x["matches"][i].status == "found" for x in scores[s])
                for i in range(scores[s][0]["expected"])
            ]
            k = len(scores[s])
            w(
                f"| `{s}` | {sum(c == k for c in counts)} | {sum(0 < c < k for c in counts)} | {sum(c == 0 for c in counts)} |"
            )
        w("")

    w("## Détail par dossier\n")
    for s in slugs:
        if not scores[s]:
            continue
        k = len(scores[s])
        first = scores[s][0]
        w(f"### `{s}`\n")
        w(
            f"Statut au passage `{first['run']}`"
            + (
                f", et nombre de passages où l'événement est trouvé (sur {k})."
                if k > 1
                else "."
            )
        )
        w("")
        w(
            "| Piste | Libellé attendu | Dates attendues | Mode | Statut | Rendu par le modèle |"
            + (" Trouvé |" if k > 1 else "")
        )
        w("|---|---|---|---|---|---|" + ("---|" if k > 1 else ""))
        for i, m in enumerate(first["matches"]):
            e = m.expected
            got = ""
            if m.produced:
                p = m.produced
                got = f"{p.label} · {date_span(p.start, p.end, p.ongoing)}" + (
                    f" · {p.mode}" if p.mode else ""
                )
                bad = [
                    CHECK_FR[c]
                    for c, ok in m.checks.items()
                    if ok is False and c != "start_as_precise"
                ]
                if bad and m.status == "found":
                    got += " ⚠ " + ", ".join(bad)
            row = (
                f"| {KIND_FR[e['track']['kind']]} | {e['track']['label']} | {date_span(e['start'], e.get('end'), e.get('ongoing', False))} "
                f"({e['certainty']}) | {e.get('mode') or ''} | {STATUS_FR[m.status]} | {got} |"
            )
            if k > 1:
                row += f" {sum(x['matches'][i].status == 'found' for x in scores[s])}/{k} |"
            w(row)
        w("")
        if first["extras"]:
            w(
                f"En plus (passage `{first['run']}`), à relire : vrai mais absent de la vérité, ou erreur.\n"
            )
            for p in first["extras"]:
                w(
                    f"- {KIND_FR.get(p.kind, p.kind)} · **{p.label}** · {date_span(p.start, p.end, p.ongoing)}"
                    + (f" · {p.mode}" if p.mode else "")
                    + f" — {p.note}"
                )
            w("")

    report = "\n".join(out) + "\n"
    (FRISE / report_name).write_text(report, encoding="utf8")
    # The same counts for the builders of the demonstration and of the library
    # (shape of comparaison-modeles.json, plus the estimated cost).
    summary = []
    for d in run_dirs:
        per: dict[str, dict] = {}
        for m in (m for m in runs_meta if m["run"] == d.name):
            sc = next(x for x in scores[m["dossier"]] if x["run"] == d.name)
            u, price = m["usage"], PRICES.get(m["model"])
            per[m["dossier"]] = {
                "found": sc["status"]["found"],
                "expected": sc["expected"],
            }
            if m["transport"] == "files" and price and "promptChars" in u:
                per[m["dossier"]]["estimatedCost"] = round(
                    estimated_cost(u["promptChars"], u["answerChars"], *price), 4
                )
        summary.append({"run": d.name, "perDossier": per})
    (FRISE / report_name).with_suffix(".json").write_text(
        json.dumps(summary, indent=2) + "\n", encoding="utf8"
    )

    print(
        f"{'dossier':20} {'attendus':>8} {'trouvés':>12} {'produits':>12} {'rappel':>12} {'précision':>12}"
    )
    for s in slugs:
        sc = scores[s]
        if sc:
            print(
                f"{s:20} {sc[0]['expected']:>8} {spread([x['status']['found'] for x in sc]):>12} "
                f"{spread([x['produced'] for x in sc]):>12} {spread([100 * x['recall'] for x in sc]):>10} % "
                f"{spread([100 * x['precision_lower_bound'] for x in sc]):>10} %"
            )
    print(f"report: {(FRISE / report_name).relative_to(ROOT)}")


if __name__ == "__main__":
    main(sys.argv[1:])
