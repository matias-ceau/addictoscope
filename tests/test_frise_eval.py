from addictoscope.frise_eval import (
    Produced,
    dates_compatible,
    label_similarity,
    match_timeline,
    validation_drops,
)


def expected(kind, label, start, end=None, mode=None, certainty="exact", sources=(), ongoing=False):
    return {
        "track": {"kind": kind, "label": label}, "start": start, "end": end, "mode": mode,
        "certainty": certainty, "sources": list(sources), "ongoing": ongoing,
    }


def produced(i, kind, label, start, end=None, mode=None, sources=(), ongoing=False):
    return Produced(id=f"e{i}", kind=kind, label=label, start=start, end=end, ongoing=ongoing,
                    mode=mode, note="", sources=list(sources))


def test_labels_match_up_to_wording_and_clinical_synonyms():
    assert label_similarity("Épisode dépressif caractérisé", "Episode depressif") == 1
    assert label_similarity("Héroïne", "Opioïdes") == 1
    assert label_similarity("Benzodiazépines (hors prescription)", "Clonazépam") == 1
    assert label_similarity("Hépatite C", "VHC") == 1
    assert label_similarity("Tentative de suicide", "Intoxication médicamenteuse volontaire") == 1
    assert label_similarity("Consultation jeunes consommateurs", "Suivi CJC (éducatrice)") == 1
    assert label_similarity("Réduction des risques crack", "Programme de RdR crack") == 1
    assert label_similarity("Rupture avec son compagnon", "Séparation après une dispute") >= 0.5
    assert label_similarity("Accompagnement social", "Entretien avec l'assistante sociale") == 1
    assert label_similarity("Suivi psychiatrique", "Suivi éducatif") == 0
    assert label_similarity("Alcool", "Cannabis") == 0


def test_date_tolerance_follows_the_expected_certainty():
    assert dates_compatible("2022-12-05", "2022-12-07", "exact")
    assert not dates_compatible("2022-12-05", "2022-12-20", "exact")
    assert dates_compatible("2023-04", "2023-04-28", "month")
    assert dates_compatible("2015", "2014", "approx")
    assert not dates_compatible("2016", "2017", "year")
    # A coarser produced date that contains the expected one is compatible.
    assert dates_compatible("2023-02-18", "2023-02", "exact")


def test_each_expected_event_gets_one_status_and_extras_are_kept():
    exp = [
        expected("substance_use", "Alcool", "2022-12-05", "2022-12-16", mode="sevrage", sources=["historique 05/12/2022"]),
        expected("substance_use", "Alcool", "2022-12-25", mode="rechute"),
        expected("life_event", "Divorce", "2016", certainty="year"),
        expected("somatic", "Overdose, réanimation", "2023-02-18"),
        expected("medication", "Sertraline", "2023-01-10", ongoing=True),
    ]
    prod = [
        produced(1, "substance_use", "Alcool", "2022-12-05", "2022-12-16", mode="sevrage", sources=["historique 05/12/2022"]),
        produced(2, "substance_use", "Alcool", "2022-12-25", mode="rechute"),
        produced(3, "life_event", "Divorce", "2017"),
        produced(4, "substance_use", "Overdose", "2023-02-18", mode="intoxication"),
        produced(5, "life_event", "Déménagement", "2023-05"),
    ]
    matches, extras = match_timeline(exp, prod)
    assert [m.status for m in matches] == ["found", "found", "misdated", "other_track", "missed"]
    assert matches[0].checks == {
        "start": True, "start_as_precise": True, "end": True, "ongoing": True, "mode": True, "source": True,
    }
    assert [e.id for e in extras] == ["e5"]


def test_a_withdrawal_filed_as_a_care_episode_is_on_another_track():
    exp = [expected("substance_use", "Alcool", "2019", mode="sevrage", certainty="approx")]
    prod = [produced(1, "therapeutic_psycho", "Sevrage hospitalier (clinique des Pins)", "2019")]
    matches, _ = match_timeline(exp, prod)
    assert matches[0].status == "other_track"


def test_a_misdated_substance_event_must_keep_its_mode():
    exp = [expected("substance_use", "Alcool", "2019", "2022-12-05", mode="rechute", certainty="approx")]
    matches, extras = match_timeline(exp, [produced(1, "substance_use", "Alcool", "2023-01-10", mode="craving")])
    assert matches[0].status == "missed"
    assert len(extras) == 1


def test_two_events_on_one_track_pair_up_by_mode_and_date():
    exp = [
        expected("substance_use", "Alcool", "2019", mode="sevrage", certainty="approx"),
        expected("substance_use", "Alcool", "2019", "2022-12-05", mode="rechute", certainty="approx"),
    ]
    prod = [
        produced(1, "substance_use", "Alcool", "2019", "2022-12-05", mode="rechute"),
        produced(2, "substance_use", "Alcool", "2019", mode="sevrage"),
    ]
    matches, _ = match_timeline(exp, prod)
    assert [m.produced.id for m in matches] == ["e2", "e1"]


def test_validation_drops_replay_the_app_rules():
    run = {
        "observations": [{"id": "historique:o1", "doc": "historique", "date": "2024-01-02"}],
        "timeline": {"tracks": [], "events": [{"id": "e1"}]},
        "rawAnswers": [{"schema": "frise", "content": {"events": [
            {"kind": "substance_use", "start": "2024", "observation_ids": ["historique:o1"]},
            {"kind": "substance_use", "start": "2024", "observation_ids": ["historique:o1"]},
            {"kind": "substance_use", "start": "2024", "observation_ids": ["o1"]},  # the short id shown
            {"kind": "substance_use", "start": "2024", "observation_ids": ["o2"]},
            {"kind": "psy", "start": "2024", "observation_ids": ["historique:o1"]},
            {"kind": "somatic", "start": "début 2024", "observation_ids": ["historique:o1"]},
        ]}}],
    }
    assert validation_drops(run) == {
        "raw": 6, "bad_kind": 1, "bad_start": 1, "no_known_source": 1, "kept": 3, "merged": 2,
    }
