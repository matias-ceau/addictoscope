"""Generate fictional patient PDFs for developing and testing the
pseudonymization step without any real data.

Every person, address and identifier below is invented. The documents
reproduce the layout traps of real exports: a boxed per-page header (the
"encadré") that cuts an observation in two, an image-only scanned letter
with no text layer, and a different hospital's layout.

The planted identifiers are written to ``ground_truth.json`` so tests can
check that each one is gone after redaction.

    uv run python scripts/make_synthetic_pdfs.py
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen.canvas import Canvas

OUT_DIR = Path(__file__).resolve().parent.parent / "data" / "anonymized"
W, H = A4


def nir_with_key(nir13: str) -> str:
    key = 97 - int(nir13) % 97
    return f"{nir13[0]} {nir13[1:3]} {nir13[3:5]} {nir13[5:7]} {nir13[7:10]} {nir13[10:13]} {key:02d}"


PATIENT = {
    "nom": "MARCHAND",
    "prenom": "Sylvie",
    "naissance": "14/06/1978",
    "ipp": "0045127893",
    "nir": nir_with_key("2780633063042"),
    "adresse": "12 rue des Tilleuls",
    "ville": "33800 BORDEAUX",
    "tel": "06 12 34 56 78",
    "email": "sylvie.marchand78@example.fr",
}
SOIGNANTS = ["DURAND Pierre", "LEROY Anne", "FAURE Michel"]
PROCHES = ["MARCHAND Odette", "Thomas"]

GROUND_TRUTH: dict[str, list[str]] = {}


def header_box(c: Canvas, page: int, total: int) -> float:
    """Draw the per-page encadré and return the y where body text starts."""
    top = H - 30
    c.setLineWidth(0.8)
    c.rect(30, top - 95, W - 60, 95)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(38, top - 14, "CENTRE HOSPITALIER FICTIF DES GRAVES")
    c.setFont("Helvetica", 8)
    c.drawString(38, top - 25, "4, allée des Platanes - 33170 GRADIGNAN")
    c.drawString(38, top - 36, "Tel. 05.00.00.00.00   Finess 33 0 99999 9")
    c.setFont("Helvetica-Bold", 9)
    c.drawString(300, top - 14, f"{PATIENT['nom']} {PATIENT['prenom'].upper()}   Admission A123456789")
    c.setFont("Helvetica", 8)
    c.drawString(300, top - 25, f"Né(e) le {PATIENT['naissance']} (46 ans)")
    c.drawString(300, top - 36, f"IPP {PATIENT['ipp']}   UFH 4321 - CSAPA")
    c.drawString(300, top - 47, f"{PATIENT['adresse']}, {PATIENT['ville']}")
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(W / 2, top - 80, "FICHE D'OBSERVATIONS")
    c.setFont("Helvetica", 7)
    c.drawString(30, 20, f"Edité le 03/09/2024 10:12 par {SOIGNANTS[1]}")
    c.drawRightString(W - 30, 20, f"Page {page} /{total}")
    return top - 115


def write_lines(c: Canvas, y: float, lines: list[tuple[str, str]]) -> float:
    for font, text in lines:
        c.setFont(*{"b": ("Helvetica-Bold", 10), "i": ("Helvetica-Oblique", 8), "r": ("Helvetica", 9.5)}[font])
        c.drawString(40, y, text)
        y -= 13
    return y


def csapa_historique(path: Path) -> None:
    p = PATIENT
    page1 = [
        ("b", "Observation psychiatrique de suivi du 02/04/2024 (Urgence : Bas)"),
        ("i", f"Validé par {SOIGNANTS[0]} - Psychiatre le 03/04/2024 à 09:15"),
        ("r", "Observations :"),
        ("r", f"Mme {p['nom']} revient en consultation accompagnée de son frère {PROCHES[1]}."),
        ("r", "Consommation d'alcool estimée à 8 UID/j, en baisse depuis le sevrage de février."),
        ("r", "Craving modéré en fin de journée, pas d'idées suicidaires scénarisées."),
        ("r", f"Joignable au {p['tel']} ou par mail {p['email']}."),
        ("r", "Poursuite de l'acamprosate 333 mg 2-2-2. Reconsulter dans 3 semaines."),
        ("r", ""),
        ("b", "Observation IDE du 15/04/2024 (Urgence : Bas)"),
        ("i", "Validé automatiquement le 16/04/2024 à 06:00 par LEROY Anne"),
        ("r", "Observations :"),
        ("r", "Entretien infirmier. Patiente décrit une rechute le week-end du 13/04 après une"),
        ("r", "dispute avec sa mère Mme MARCHAND Odette. Alcoolémie à l'arrivée : 0,0 g/L."),
        ("r", "La patiente souhaite reprendre contact avec l'assistante sociale pour son dossier"),
        ("r", f"de logement (numéro de sécurité sociale {p['nir']}). Elle évoque une"),
    ]
    page2 = [
        ("r", "situation financière difficile et des dettes auprès de son ancien bailleur."),
        ("r", "Conclusions :"),
        ("r", "Orientation vers l'AS. Prochain RDV IDE le 29/04."),
        ("r", ""),
        ("b", "Observation psychiatrique de suivi du 06/05/2024 (Urgence : Bas)"),
        ("i", f"Dernière modification le 06/05/2024 à 17:40 par {SOIGNANTS[2]} - Psychiatre"),
        ("r", "Observations :"),
        ("r", "Abstinence depuis 3 semaines confirmée par CDT normale."),
        ("r", f"Le Dr DURAND a été informé. Mme {p['prenom']} {p['nom']} reprend le travail à mi-temps."),
        ("r", "Pas de craving rapporté. Sommeil amélioré."),
    ]
    c = Canvas(str(path), pagesize=A4)
    c.setTitle(f"Historique {p['nom']} {p['prenom']}")
    c.setAuthor(SOIGNANTS[1])
    for i, lines in enumerate([page1, page2], start=1):
        y = header_box(c, i, 2)
        write_lines(c, y, lines)
        c.showPage()
    c.save()
    GROUND_TRUTH[path.name] = [
        p["nom"], p["prenom"], p["naissance"], p["ipp"], p["nir"], p["tel"], p["email"],
        p["adresse"], "DURAND", "LEROY", "FAURE", "Odette", "Thomas", "A123456789",
    ]


def courrier_scanne(path: Path) -> None:
    """A letter rendered to an image and wrapped back into a PDF: no text layer."""
    p = PATIENT
    with tempfile.TemporaryDirectory() as tmp:
        text_pdf = Path(tmp) / "letter.pdf"
        c = Canvas(str(text_pdf), pagesize=A4)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, H - 60, "Clinique Fictive Saint-Exupéry - Service d'addictologie")
        c.setFont("Helvetica", 11)
        lines = [
            "Bordeaux, le 21/02/2024",
            "",
            "Cher confrère,",
            "",
            f"Je vous adresse Mme {p['prenom']} {p['nom']}, née le {p['naissance']},",
            f"demeurant {p['adresse']}, {p['ville']}, hospitalisée du 05/02/2024",
            "au 19/02/2024 pour sevrage d'alcool simple, sans complication.",
            "Traitement de sortie : acamprosate, thiamine 250 mg/j.",
            "Suivi proposé au CSAPA. Je reste à votre disposition.",
            "",
            "Dr Hélène BERTIN",
        ]
        y = H - 110
        for line in lines:
            c.drawString(60, y, line)
            y -= 18
        c.save()
        png_prefix = Path(tmp) / "page"
        subprocess.run(["pdftoppm", "-r", "150", "-png", "-singlefile", str(text_pdf), str(png_prefix)], check=True)
        out = Canvas(str(path), pagesize=A4)
        out.drawImage(ImageReader(str(png_prefix) + ".png"), 0, 0, W, H)
        out.showPage()
        out.save()
    GROUND_TRUTH[path.name] = [p["nom"], p["prenom"], p["naissance"], p["adresse"], "BERTIN"]


def autre_hopital(path: Path) -> None:
    """A different hospital's export: label/value header table, no encadré."""
    p = PATIENT
    c = Canvas(str(path), pagesize=A4)
    rows = [
        ("Patient", f"{p['prenom']} {p['nom']}"),
        ("Date de naissance", p["naissance"]),
        ("N° dossier", "D-2024-77812"),
        ("Médecin référent", "Dr GARNIER Paul"),
    ]
    y = H - 60
    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, y, "Hôpital Fictif du Bassin - Consultations")
    y -= 30
    for label, value in rows:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(40, y, label)
        c.setFont("Helvetica", 10)
        c.drawString(180, y, value)
        y -= 15
    y -= 15
    for line in [
        "12/01/2024 — Consultation addictologie (Dr GARNIER)",
        "Tabac 20 cig/j, cannabis 3 joints/j. Motivation ambivalente.",
        "",
        "26/01/2024 — Entretien psychologue (Mme ROUSSEL Claire)",
        "Travail sur les situations à risque. Patiente vit avec son compagnon Julien.",
    ]:
        c.setFont("Helvetica", 10)
        c.drawString(40, y, line)
        y -= 14
    c.save()
    GROUND_TRUTH[path.name] = [p["nom"], p["prenom"], p["naissance"], "D-2024-77812", "GARNIER", "ROUSSEL", "Julien"]


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    csapa_historique(OUT_DIR / "synthetique-historique-csapa.pdf")
    courrier_scanne(OUT_DIR / "synthetique-courrier-scanne.pdf")
    autre_hopital(OUT_DIR / "synthetique-autre-hopital.pdf")
    (OUT_DIR / "ground_truth.json").write_text(json.dumps(GROUND_TRUTH, ensure_ascii=False, indent=2) + "\n")
    print(f"wrote {len(GROUND_TRUTH)} PDFs to {OUT_DIR}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
