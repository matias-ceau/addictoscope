from datetime import date

from addictoscope.ingest.cleaning import clean_document, strip_page_noise
from addictoscope.ingest.entries import parse_observations, resolve_fonctions

HEADER = """CH CHARLES PERRENS
121, rue de la Bechade
CS 81285
33076 BORDEAUX CEDEX
Tel. 05.56.56.34.34 Finess 33 0 00063 9
Siret 263 305 849 00014
DUPONT JEAN Admission A999999999 Méd. TESTMED - TESTMED ALPHA
lun. 01/01/24 10:00 (10 nuits) UFM 1234 - CSAPA
Né(e) le 01/01/1980 (44 ans)
IPP 0000000001 UFH 1234 - CSAPA
FICHE D'OBSERVATIONS"""

PAGE_1 = f"""{HEADER}
Observation psychiatrique de suivi du 15/03/2024 (Urgence : Bas)
Validé automatiquement le 18/03/2024 à 06:00 par ALPHA Bruno
Observations :
Ceci est le debut d'une observation coupee par le saut de page et qui doit
Edité le 20/05/2024 11:47 par EXPORT Test Page 1 /2"""

PAGE_2 = f"""{HEADER}
se poursuivre normalement sur la page suivante sans coupure visible.
Conclusions :

Observation IDE du 10/01/2023 (Urgence : Bas)
Validé automatiquement le 12/01/2023 à 06:00 par ALPHA Bruno
Observations :
Note infirmiere de Alpha Bruno, fonction deductible du type_label.

Observation éducateur spécialisé du 05/02/2024 (Urgence : Bas)
Dernière modification le 06/02/2024 à 09:00 par BETA Claire - Educateur spécialisé
Observations :
Note educateur avec fonction explicite.

Observation SECOP du 20/02/2024 (Urgence : Bas)
Validé automatiquement le 21/02/2024 à 06:00 par ALPHA Bruno
Observations :
Deuxieme note de Alpha Bruno, type ambigu, doit heriter de sa fonction
connue par ailleurs.

Observation autre intervenant du 01/03/2024 (Urgence : Bas)
Validé automatiquement le 02/03/2024 à 06:00 par INCONNU Personne
Observations :
Aucune fonction connue nulle part pour cet auteur.
Page 2 /2"""


def test_strip_page_noise_removes_header_and_footer_only():
    cleaned = strip_page_noise(PAGE_1)
    assert "CH CHARLES PERRENS" not in cleaned
    assert "IPP 0000000001" not in cleaned
    assert "Edité le 20/05/2024" not in cleaned
    assert "Observation psychiatrique de suivi du 15/03/2024" in cleaned
    assert "Ceci est le debut" in cleaned


def test_clean_document_reconnects_an_observation_split_across_a_page_break():
    cleaned = clean_document([PAGE_1, PAGE_2])
    assert "CH CHARLES PERRENS" not in cleaned
    # the sentence split by the page-1/page-2 header now reads as one block
    assert "doit\nse poursuivre normalement" in cleaned


def test_parse_observations_extracts_the_true_clinical_date_not_validation_date():
    cleaned = clean_document([PAGE_1, PAGE_2])
    entries = parse_observations(cleaned, source_document="test.pdf")

    suivi = next(e for e in entries if e.type_label == "psychiatrique de suivi")
    assert suivi.date == date(2024, 3, 15)  # title date, not the 18/03/2024 validation date
    assert suivi.author == "ALPHA Bruno"
    assert suivi.fonction is None  # auto-validated, no fonction on the status line
    assert "se poursuivre normalement" in suivi.body


def test_parse_observations_document_order_is_not_chronological():
    cleaned = clean_document([PAGE_1, PAGE_2])
    entries = parse_observations(cleaned, source_document="test.pdf")
    dates_in_document_order = [e.date for e in entries]
    assert dates_in_document_order != sorted(dates_in_document_order)


def test_resolve_fonctions_three_tiers():
    cleaned = clean_document([PAGE_1, PAGE_2])
    entries = resolve_fonctions(parse_observations(cleaned, source_document="test.pdf"))
    by_type = {e.type_label: e for e in entries}

    # tier 1: explicit on the status line
    assert by_type["éducateur spécialisé"].fonction == "Educateur spécialisé"
    assert by_type["éducateur spécialisé"].fonction_source == "explicit"

    # tier 2: unambiguous type_label
    assert by_type["IDE"].fonction == "Infirmier(ère)"
    assert by_type["IDE"].fonction_source == "type_label"

    # tier 3: cross-referenced from this author's other (tier-2-resolved) entry
    assert by_type["SECOP"].fonction == "Infirmier(ère)"
    assert by_type["SECOP"].fonction_source == "cross_reference"
    assert by_type["psychiatrique de suivi"].fonction == "Infirmier(ère)"
    assert by_type["psychiatrique de suivi"].fonction_source == "cross_reference"

    # no signal anywhere for this author: stays unresolved
    assert by_type["autre intervenant"].fonction is None
    assert by_type["autre intervenant"].fonction_source == "unresolved"
