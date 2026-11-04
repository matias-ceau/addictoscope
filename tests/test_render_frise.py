"""render_frise.py on a small app run: --key re-identification, undated and age-based events.

All names below are invented.
"""

import importlib.util
import json
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "render_frise.py"


@pytest.fixture(scope="module")
def render_frise():
    spec = importlib.util.spec_from_file_location("render_frise", SCRIPT)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def app_run() -> dict:
    return {
        "dossier": "dossier-fictif",
        "observations": [
            {
                "id": "historique:o1",
                "doc": "historique",
                "date": "2023-02-10",
                "kind": "psychiatrique",
                "summary": "[PATIENT] vue par [SOIGNANT_2] avec [PROCHE_1].",
            },
            {
                "id": "historique:o2",
                "doc": "historique",
                "date": "2024-05-02",
                "kind": "IDE",
                "summary": "Appel de [SOIGNANT_9].",
            },
        ],
        "timeline": {
            "tracks": [
                {"id": "t1", "kind": "substance_use", "label": "Alcool"},
                {"id": "t2", "kind": "life_event", "label": "Rupture avec [PROCHE_1]"},
                {
                    "id": "t3",
                    "kind": "therapeutic_psycho",
                    "label": "Suivi par [SOIGNANT_2]",
                },
                {"id": "t4", "kind": "substance_use", "label": "Cannabis"},
            ],
            "events": [
                {
                    "id": "e1",
                    "trackId": "t2",
                    "start": "2023-02",
                    "end": None,
                    "ongoing": False,
                    "mode": None,
                    "lossOfControl": False,
                    "note": "[PATIENT] quitte [PROCHE_1].",
                    "observationIds": ["historique:o1"],
                },
                {
                    "id": "e2",
                    "trackId": "t3",
                    "start": "2023-02-10",
                    "end": None,
                    "ongoing": True,
                    "mode": None,
                    "lossOfControl": False,
                    "note": "Suivi par [SOIGNANT_2], relais [SOIGNANT_9].",
                    "observationIds": ["historique:o1", "historique:o2"],
                },
                {
                    "id": "e3",
                    "trackId": "t1",
                    "start": "1973",
                    "end": "1978",
                    "ongoing": False,
                    "mode": "usage",
                    "lossOfControl": False,
                    "note": "Ivresses de [PATIENT] à l'adolescence.",
                    "observationIds": ["historique:o1"],
                    "fromAge": {"start": [12, 17], "end": None},
                },
            ],
            "undated": [
                {
                    "id": "e4",
                    "trackId": "t4",
                    "ongoing": False,
                    "mode": "usage",
                    "lossOfControl": False,
                    "note": "Premier joint de [PATIENT] à 14 ans.",
                    "observationIds": ["historique:o1"],
                    "startAge": [14, 14],
                    "endAge": None,
                },
            ],
        },
    }


KEY = {
    "labels": {
        "[PATIENT]": "VASSEUR Maëlys",
        "[SOIGNANT_2]": "LEROY Martine",
        "[PROCHE_1]": "BRUNEL Anatole",
    }
}


def render(module, tmp_path: Path, key: dict | None) -> str:
    run = tmp_path / "run.json"
    run.write_text(json.dumps(app_run(), ensure_ascii=False), encoding="utf-8")
    out = tmp_path / "out.html"
    argv = [str(run), "-o", str(out)]
    if key is not None:
        table = tmp_path / "table.json"
        table.write_text(json.dumps(key, ensure_ascii=False), encoding="utf-8")
        argv += ["--key", str(table)]
    assert module.main(argv) == 0
    return out.read_text(encoding="utf-8")


def test_without_key_the_page_stays_pseudonymised(render_frise, tmp_path):
    page = render(render_frise, tmp_path, None)
    assert "[PATIENT]" in page
    assert "[SOIGNANT_2]" in page
    for real in ("VASSEUR", "Maëlys", "LEROY", "BRUNEL"):
        assert real not in page


def test_key_replaces_labels_everywhere(render_frise, tmp_path):
    page = render(render_frise, tmp_path, KEY)
    for label in KEY["labels"]:
        assert label not in page
    assert "VASSEUR Maëlys quitte BRUNEL Anatole." in page  # event note
    assert "Rupture avec BRUNEL Anatole" in page  # track label
    assert "Suivi par LEROY Martine" in page  # track label and note
    assert (
        "VASSEUR Maëlys vue par LEROY Martine avec BRUNEL Anatole." in page
    )  # observation text
    assert "Premier joint de VASSEUR Maëlys à 14 ans." in page  # undated note


def test_key_keeps_unknown_labels(render_frise, tmp_path):
    page = render(render_frise, tmp_path, KEY)
    assert "[SOIGNANT_9]" in page
    assert "relais [SOIGNANT_9]" in page


def test_undated_events_are_listed(render_frise, tmp_path):
    page = render(render_frise, tmp_path, None)
    assert "Premier joint de [PATIENT] à 14 ans." in page


def test_age_based_events_are_drawn(render_frise, tmp_path):
    page = render(render_frise, tmp_path, None)
    assert "Ivresses de [PATIENT] à l'adolescence." in page
