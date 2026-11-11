from addictoscope.frise_eval import (
    Produced,
    dates_compatible,
    estimated_cost,
    label_similarity,
    match_timeline,
    score_run,
    validation_drops,
)


def expected(
    kind,
    label,
    start,
    end=None,
    mode=None,
    certainty="exact",
    sources=(),
    ongoing=False,
):
    return {
        "track": {"kind": kind, "label": label},
        "start": start,
        "end": end,
        "mode": mode,
        "certainty": certainty,
        "sources": list(sources),
        "ongoing": ongoing,
    }


def produced(i, kind, label, start, end=None, mode=None, sources=(), ongoing=False):
    return Produced(
        id=f"e{i}",
        kind=kind,
        label=label,
        start=start,
        end=end,
        ongoing=ongoing,
        mode=mode,
        note="",
        sources=list(sources),
    )


def test_labels_match_up_to_wording_and_clinical_synonyms():
    assert label_similarity("Épisode dépressif caractérisé", "Episode depressif") == 1
    assert label_similarity("Héroïne", "Opioïdes") == 1
    assert label_similarity("Benzodiazépines (hors prescription)", "Clonazépam") == 1
    assert label_similarity("Hépatite C", "VHC") == 1
    assert (
        label_similarity(
            "Tentative de suicide", "Intoxication médicamenteuse volontaire"
        )
        == 1
    )
    assert (
        label_similarity("Consultation jeunes consommateurs", "Suivi CJC (éducatrice)")
        == 1
    )
    assert (
        label_similarity("Réduction des risques crack", "Programme de RdR crack") == 1
    )
    assert (
        label_similarity("Rupture avec son compagnon", "Séparation après une dispute")
        >= 0.5
    )
    assert (
        label_similarity("Accompagnement social", "Entretien avec l'assistante sociale")
        == 1
    )
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
        expected(
            "substance_use",
            "Alcool",
            "2022-12-05",
            "2022-12-16",
            mode="sevrage",
            sources=["historique 05/12/2022"],
        ),
        expected("substance_use", "Alcool", "2022-12-25", mode="rechute"),
        expected("life_event", "Divorce", "2016", certainty="year"),
        expected("somatic", "Overdose, réanimation", "2023-02-18"),
        expected("medication", "Sertraline", "2023-01-10", ongoing=True),
    ]
    prod = [
        produced(
            1,
            "substance_use",
            "Alcool",
            "2022-12-05",
            "2022-12-16",
            mode="sevrage",
            sources=["historique 05/12/2022"],
        ),
        produced(2, "substance_use", "Alcool", "2022-12-25", mode="rechute"),
        produced(3, "life_event", "Divorce", "2017"),
        produced(4, "substance_use", "Overdose", "2023-02-18", mode="intoxication"),
        produced(5, "life_event", "Déménagement", "2023-05"),
    ]
    matches, extras = match_timeline(exp, prod)
    assert [m.status for m in matches] == [
        "found",
        "found",
        "misdated",
        "other_track",
        "missed",
    ]
    assert matches[0].checks == {
        "start": True,
        "start_as_precise": True,
        "end": True,
        "ongoing": True,
        "mode": True,
        "source": True,
    }
    assert [e.id for e in extras] == ["e5"]


def test_a_withdrawal_filed_as_a_care_episode_is_on_another_track():
    exp = [
        expected("substance_use", "Alcool", "2019", mode="sevrage", certainty="approx")
    ]
    prod = [
        produced(
            1, "therapeutic_psycho", "Sevrage hospitalier (clinique des Pins)", "2019"
        )
    ]
    matches, _ = match_timeline(exp, prod)
    assert matches[0].status == "other_track"


def test_a_misdated_substance_event_must_keep_its_mode():
    exp = [
        expected(
            "substance_use",
            "Alcool",
            "2019",
            "2022-12-05",
            mode="rechute",
            certainty="approx",
        )
    ]
    matches, extras = match_timeline(
        exp, [produced(1, "substance_use", "Alcool", "2023-01-10", mode="craving")]
    )
    assert matches[0].status == "missed"
    assert len(extras) == 1


def test_two_events_on_one_track_pair_up_by_mode_and_date():
    exp = [
        expected("substance_use", "Alcool", "2019", mode="sevrage", certainty="approx"),
        expected(
            "substance_use",
            "Alcool",
            "2019",
            "2022-12-05",
            mode="rechute",
            certainty="approx",
        ),
    ]
    prod = [
        produced(1, "substance_use", "Alcool", "2019", "2022-12-05", mode="rechute"),
        produced(2, "substance_use", "Alcool", "2019", mode="sevrage"),
    ]
    matches, _ = match_timeline(exp, prod)
    assert [m.produced.id for m in matches] == ["e2", "e1"]


def test_validation_drops_replay_the_app_rules():
    run = {
        "observations": [
            {"id": "historique:o1", "doc": "historique", "date": "2024-01-02"}
        ],
        "timeline": {"tracks": [], "events": [{"id": "e1"}]},
        "rawAnswers": [
            {
                "schema": "frise",
                "content": {
                    "events": [
                        {
                            "kind": "substance_use",
                            "start": "2024",
                            "observation_ids": ["historique:o1"],
                        },
                        {
                            "kind": "substance_use",
                            "start": "2024",
                            "observation_ids": ["historique:o1"],
                        },
                        {
                            "kind": "substance_use",
                            "start": "2024",
                            "observation_ids": ["o1"],
                        },  # the short id shown
                        {
                            "kind": "substance_use",
                            "start": "2024",
                            "observation_ids": ["o2"],
                        },
                        {
                            "kind": "psy",
                            "start": "2024",
                            "observation_ids": ["historique:o1"],
                        },
                        {
                            "kind": "somatic",
                            "start": "début 2024",
                            "observation_ids": ["historique:o1"],
                        },
                    ]
                },
            }
        ],
    }
    assert validation_drops(run) == {
        "raw": 6,
        "bad_kind": 1,
        "bad_start": 1,
        "by_age": 0,
        "by_mention": 0,
        "no_known_source": 1,
        "kept": 3,
        "merged": 2,
    }


def test_an_event_without_a_start_is_kept_when_its_first_mention_places_it():
    run = {
        "observations": [
            {"id": "historique:o1", "doc": "historique", "date": "2022-04-05"},
            {"id": "historique:o2", "doc": "historique", "date": None},
        ],
        "timeline": {"tracks": [], "events": [{"id": "e1"}, {"id": "e2"}]},
        "rawAnswers": [
            {
                "schema": "frise",
                "content": {
                    "events": [
                        {
                            "kind": "medication",
                            "start": None,
                            "end": "2022-08",
                            "observation_ids": ["o1"],
                        },
                        {
                            "kind": "somatic",
                            "start": None,
                            "ongoing": True,
                            "observation_ids": ["o1"],
                        },
                        {
                            "kind": "somatic",
                            "start": None,
                            "observation_ids": ["o1"],
                        },  # neither an end nor going on
                        {
                            "kind": "somatic",
                            "start": None,
                            "ongoing": True,
                            "observation_ids": ["o2"],
                        },  # no dated source
                    ]
                },
            }
        ],
    }
    counts = validation_drops(run)
    assert (
        counts["kept"],
        counts["by_mention"],
        counts["by_age"],
        counts["bad_start"],
        counts["merged"],
    ) == (2, 2, 0, 2, 0)


def test_merged_counts_the_lots_not_the_regroupement():
    run = {
        "observations": [
            {"id": "historique:o1", "doc": "historique", "date": "2024-01-02"}
        ],
        "timelineRead": {"tracks": [], "events": [{"id": "e1"}, {"id": "e2"}]},
        "timeline": {"tracks": [], "events": [{"id": "e1"}]},
        "rawAnswers": [
            {
                "schema": "frise",
                "content": {
                    "events": [
                        {"kind": "somatic", "start": "2014", "observation_ids": ["o1"]},
                        {
                            "kind": "somatic",
                            "start": "2014-10",
                            "observation_ids": ["o1"],
                        },
                    ]
                },
            },
            {
                "schema": "regroupement",
                "content": {
                    "tracks": [],
                    "events": [
                        {"event_ids": ["e1", "e2"], "start": "2014-10", "end": None}
                    ],
                },
            },
        ],
    }
    counts = validation_drops(run)
    assert (counts["raw"], counts["kept"], counts["merged"]) == (2, 2, 0)


def test_a_molecule_stands_for_its_class_on_a_consumption_track_only():
    assert label_similarity("Oxycodone", "Opioïdes") == 0
    assert label_similarity("Oxycodone", "Opioïdes", substance=True) == 1
    assert label_similarity("Buprénorphine de rue", "Opioïdes", substance=True) == 1
    assert label_similarity("Alcool", "Opioïdes", substance=True) == 0
    exp = [
        expected("substance_use", "Oxycodone", "2016", mode="usage", certainty="year"),
        expected("medication", "Méthadone", "2021-03", certainty="month"),
    ]
    prod = [
        produced(1, "substance_use", "Opioïdes", "2016", mode="usage"),
        produced(2, "medication", "Buprénorphine", "2021-03"),
    ]
    matches, extras = match_timeline(exp, prod)
    assert [m.status for m in matches] == ["found", "missed"]
    assert [e.id for e in extras] == ["e2"]


def test_a_regrouped_track_answers_to_every_label_it_was_read_under():
    exp = [expected("medication", "Sofosbuvir/velpatasvir", "2021-10-18")]
    one = produced(1, "medication", "Traitement antiviral du VHC", "2021-10-18")
    assert [m.status for m in match_timeline(exp, [one])[0]] == ["missed"]
    one.aliases = ["Sofosbuvir/velpatasvir"]
    assert [m.status for m in match_timeline(exp, [one])[0]] == ["found"]


def test_a_date_held_by_a_merged_mention_counts_only_when_asked():
    # Onset told at intake, diagnosis years later: one bar, which starts at the onset.
    exp = [expected("psychiatric", "TDAH", "2024-01-09")]
    bar = produced(1, "psychiatric", "TDAH", "1985")
    bar.told = ["1985", "2019"]
    assert [m.status for m in match_timeline(exp, [bar])[0]] == ["misdated"]
    assert [m.status for m in match_timeline(exp, [bar], mentions=True)[0]] == [
        "misdated"
    ]
    bar.told = ["1985", "2024-01"]
    assert [m.status for m in match_timeline(exp, [bar])[0]] == ["misdated"]
    assert [m.status for m in match_timeline(exp, [bar], mentions=True)[0]] == ["found"]


def test_an_event_dated_by_an_age_is_kept_not_dropped():
    run = {
        "observations": [
            {"id": "historique:o1", "doc": "historique", "date": "2024-01-02"}
        ],
        "timeline": {"tracks": [], "events": [{"id": "e1"}], "undated": [{"id": "u1"}]},
        "rawAnswers": [
            {
                "schema": "frise",
                "content": {
                    "events": [
                        {
                            "kind": "life_event",
                            "start": None,
                            "start_age": 9,
                            "observation_ids": ["o1"],
                        },
                        {
                            "kind": "life_event",
                            "start": None,
                            "start_age": "adolescence",
                            "observation_ids": ["o1"],
                        },
                        {
                            "kind": "life_event",
                            "start": None,
                            "start_age": None,
                            "observation_ids": ["o1"],
                        },
                    ]
                },
            }
        ],
    }
    counts = validation_drops(run)
    assert (
        counts["kept"],
        counts["by_age"],
        counts["bad_start"],
        counts["merged"],
    ) == (2, 2, 1, 0)


def test_recall_is_split_by_where_the_event_comes_from(tmp_path):
    (tmp_path / "historique.pdf").write_bytes(b"")
    (tmp_path / "notes.txt").write_text(
        "### 14/03/2022 | Observation médicale d'entrée | A | Médecin | le 14/03/2022 11:02\ntexte\n"
        "### 02/05/2023 | Entretien | B | Psychologue | le 02/05/2023 10:00\ntexte\n",
        encoding="utf8",
    )
    verite = {
        "timeline": [
            expected(
                "substance_use", "Alcool", "2010", mode="usage", certainty="approx"
            )
            | {"origin": "intake"},
            expected("medication", "Acamprosate", "2022-03-14")
            | {"origin": "follow_up"},
            expected(
                "psychiatric", "Tentative de suicide", "2009-09", certainty="month"
            )
            | {"origin": "late"},
            expected("life_event", "Divorce", "2023-04", certainty="month")
            | {"origin": "late"},
        ]
    }
    run = {
        "observations": [
            {"id": "h-1", "doc": "historique", "date": "2022-03-14"},
            {"id": "h-2", "doc": "historique", "date": "2023-05-02"},
        ],
        "timeline": {
            "tracks": [
                {"id": "t1", "kind": "substance_use", "label": "Alcool"},
                {"id": "t2", "kind": "medication", "label": "Acamprosate"},
                {"id": "t3", "kind": "life_event", "label": "Divorce"},
            ],
            "events": [
                {
                    "id": "e1",
                    "trackId": "t1",
                    "start": "2010",
                    "end": None,
                    "ongoing": False,
                    "mode": "usage",
                    "note": "",
                    "observationIds": ["h-1"],
                },
                {
                    "id": "e2",
                    "trackId": "t2",
                    "start": "2022-03-14",
                    "end": None,
                    "ongoing": True,
                    "mode": None,
                    "note": "",
                    "observationIds": ["h-1"],
                },
                {
                    "id": "e3",
                    "trackId": "t3",
                    "start": "2023-04",
                    "end": None,
                    "ongoing": False,
                    "mode": None,
                    "note": "",
                    "observationIds": ["h-2"],
                },
            ],
        },
    }
    score = score_run(run, verite, tmp_path)
    assert score["by_origin"] == {"intake": [1, 1], "follow_up": [1, 1], "late": [1, 2]}
    assert score["status"]["missed"] == 1
    assert (
        score["tracks"],
        score["expected_tracks"],
        score["read"],
        score["consolidation"],
    ) == (3, 4, None, None)
    assert score["found_with_mentions"] is None

    # The same run, regrouped: the frise as read had the divorce twice.
    stats = {
        "lots": 2,
        "tracksBefore": 4,
        "tracksAfter": 3,
        "eventsBefore": 4,
        "eventsAfter": 3,
        "discordant": 0,
    }
    read = {
        "tracks": run["timeline"]["tracks"]
        + [{"id": "t4", "kind": "life_event", "label": "Séparation"}],
        "events": run["timeline"]["events"]
        + [
            {
                "id": "e4",
                "trackId": "t4",
                "start": "2023",
                "end": None,
                "ongoing": False,
                "mode": None,
                "note": "",
                "observationIds": ["h-2"],
            }
        ],
    }
    regrouped = score_run(
        run
        | {
            "timelineRead": read,
            "timeline": run["timeline"] | {"consolidation": stats},
        },
        verite,
        tmp_path,
    )
    assert (regrouped["produced"], regrouped["read"]["produced"]) == (3, 4)
    assert (regrouped["tracks"], regrouped["read"]["tracks"]) == (3, 4)
    assert regrouped["status"]["found"] == regrouped["read"]["status"]["found"] == 3
    assert regrouped["consolidation"] == stats
    # The bar of the divorce starts at the separation; its date is one of the mentions under it.
    told = [
        {"start": "2021", "end": None, "note": "", "observationIds": ["h-1"]},
        {"start": "2023-04", "end": None, "note": "", "observationIds": ["h-2"]},
    ]
    events = [
        e | ({"tellings": told, "start": "2021"} if e["id"] == "e3" else {})
        for e in run["timeline"]["events"]
    ]
    under = score_run(
        run | {"timeline": run["timeline"] | {"events": events}}, verite, tmp_path
    )
    assert (under["status"]["found"], under["found_with_mentions"]) == (2, 3)
    assert regrouped["read"]["read"] is None


def test_short_dossiers_have_no_origin_to_split_on(tmp_path):
    (tmp_path / "historique.pdf").write_bytes(b"")
    (tmp_path / "notes.txt").write_text(
        "### 14/03/2022 | Entretien | A | IDE | le 14/03/2022 11:02\ntexte\n",
        encoding="utf8",
    )
    verite = {
        "timeline": [
            expected(
                "substance_use", "Alcool", "2010", mode="usage", certainty="approx"
            )
        ]
    }
    run = {"observations": [], "timeline": {"tracks": [], "events": []}}
    assert score_run(run, verite, tmp_path)["by_origin"] == {}


def test_cost_of_equivalent_paid_calls_from_the_characters_exchanged():
    # 3 characters per prompt token, 1.47 per answer token, prices per million tokens.
    assert estimated_cost(300_000, 0, 2.0, 10.0) == 0.2
    assert round(estimated_cost(0, 147_000, 2.0, 10.0), 6) == 1.0
    assert estimated_cost(0, 0, 2.0, 10.0) == 0
