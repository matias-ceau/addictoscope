"""Render fictional patient dossiers: many notes per patient, written by
different people over months or years, as the patient record exports them.

Every person, place of care and identifier is invented. The notes keep what
makes real records hard to read and to pseudonymise:

- each writer's style: terse night-shift nursing notes, verbose resident
  notes, narrative psychology notes, social work paperwork, letters;
- typos, in names too ("DESMAZURE" for "DESMAZURES");
- approximate dates ("il y a 3 ans", "vers 14 ans", "depuis les fêtes");
- statements that contradict each other (age at first use, doses,
  diagnoses) while the story as a whole stays coherent.

Each dossier lives in data/anonymized/dossiers/<slug>/:

    verite.json   what a careful reader knows: identity, the identifiers
                  planted in each document, the timeline (frise) to expect,
                  and the contradictions planted, with the reading to keep
    notes.txt     the notes of the record export, as written
    *.txt         other documents (letter, emergency report)
    *.pdf         the rendered documents

Source format. notes.txt: one note per "### date | title | author | role |
validation" line, then its text; validation is "le DD/MM/YYYY HH:MM",
"auto DD/MM/YYYY HH:MM" or "modif DD/MM/YYYY HH:MM". Other documents:
[entete], [colonne], [champs] and [corps] sections. In every source, "~"
joins words that must stay on one line (phone numbers, addresses).

Each document's identifiers are added to ground_truth.json, so the pipeline
tests check that every one is gone after redaction. Run after
make_synthetic_pdfs.py, which rewrites that file:

    uv run python scripts/make_fictional_dossiers.py
"""
from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen.canvas import Canvas

DATA = Path(__file__).resolve().parent.parent / "data" / "anonymized"
DOSSIERS = DATA / "dossiers"
W, H = A4
LEFT, RIGHT = 40, W - 40
BOTTOM = 45

FONTS = {
    "title": ("Helvetica-Bold", 10),
    "meta": ("Helvetica-Oblique", 8),
    "body": ("Helvetica", 9.5),
    "small": ("Helvetica", 7.5),
    "small-bold": ("Helvetica-Bold", 7.5),
    "letter": ("Helvetica", 10),
    "letter-bold": ("Helvetica-Bold", 10),
}
LEADING = {"title": 14, "meta": 11, "body": 12.5, "small": 9.5, "small-bold": 9.5, "letter": 13.5, "letter-bold": 13.5}


def fold(s: str) -> str:
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().upper()


@dataclass
class Line:
    style: str
    text: str
    x: float = LEFT


def wrap(text: str, style: str, width: float) -> list[str]:
    """Greedy word wrap; "~" keeps words together and is drawn as a space."""
    font, size = FONTS[style]
    lines: list[str] = []
    current = ""
    for word in text.split(" "):
        trial = f"{current} {word}" if current else word
        if current and stringWidth(trial.replace("~", " "), font, size) > width:
            lines.append(current)
            current = word
        else:
            current = trial
    lines.append(current)
    return [line.replace("~", " ") for line in lines]


def paragraph(text: str, style: str, x: float, width: float) -> list[Line]:
    return [Line(style, t, x) for t in wrap(text, style, width)] if text.strip() else [Line("body", "", x)]


# --- record export (historique) -------------------------------------------------

def parse_notes(source: str) -> list[dict]:
    notes = []
    for block in re.split(r"^### ", source, flags=re.M)[1:]:
        head, _, body = block.partition("\n")
        date, title, author, role, validation = [p.strip() for p in head.split("|")]
        notes.append({"date": date, "title": title, "author": author, "role": role,
                      "validation": validation, "body": body.strip("\n")})
    return notes


def validation_line(note: dict) -> str:
    kind, when = note["validation"].split(" ", 1)
    day, time = when.split(" ")
    if kind == "auto":
        return f"Validé automatiquement le {day} à {time} par {note['author']}"
    if kind == "modif":
        return f"Dernière modification le {day} à {time} par {note['author']} - {note['role']}"
    return f"Validé par {note['author']} - {note['role']} le {day} à {time}"


def historique_lines(notes: list[dict]) -> list[Line]:
    lines: list[Line] = []
    for note in notes:
        lines += paragraph(f"{note['title']} du {note['date']} (Urgence : Bas)", "title", LEFT, RIGHT - LEFT)
        lines.append(Line("meta", validation_line(note)))
        for text in note["body"].split("\n"):
            lines += paragraph(text, "body", LEFT, RIGHT - LEFT)
        lines.append(Line("body", ""))
    return lines


def header_box(c: Canvas, header: dict, export: dict, page: int, total: int) -> float:
    """The per-page encadré of the record export; returns where the body starts."""
    top = H - 30
    c.setLineWidth(0.8)
    c.rect(30, top - 95, W - 60, 95)
    for i, text in enumerate(header["establishment"]):
        c.setFont("Helvetica-Bold" if i == 0 else "Helvetica", 9 if i == 0 else 8)
        c.drawString(38, top - 14 - 11 * i, text)
    for i, text in enumerate(header["patient"]):
        c.setFont("Helvetica-Bold" if i == 0 else "Helvetica", 9 if i == 0 else 8)
        c.drawString(310, top - 14 - 11 * i, text)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(W / 2, top - 82, header["title"])
    c.setFont("Helvetica", 7)
    c.drawString(30, 20, f"Edité le {export['edited']} par {export['by']}")
    c.drawRightString(W - 30, 20, f"Page {page} /{total}")
    return top - 115


def render_historique(path: Path, notes: list[dict], header: dict, export: dict) -> list[str]:
    lines = historique_lines(notes)
    body_top = H - 30 - 115
    per_page = int((body_top - BOTTOM) // LEADING["body"])
    pages: list[list[Line]] = []
    current: list[Line] = []
    y = body_top
    for line in lines:
        step = LEADING[line.style]
        if y - step < BOTTOM:
            pages.append(current)
            current, y = [], body_top
        if not current and not line.text:
            continue
        current.append(line)
        y -= step
    if current:
        pages.append(current)
    assert per_page > 0
    c = Canvas(str(path), pagesize=A4)
    c.setTitle("Historique des observations")
    drawn = [*header["establishment"], *header["patient"], f"Edité le {export['edited']} par {export['by']}"]
    for n, page in enumerate(pages, start=1):
        y = header_box(c, header, export, n, len(pages))
        for line in page:
            c.setFont(*FONTS[line.style])
            c.drawString(line.x, y, line.text)
            drawn.append(line.text)
            y -= LEADING[line.style]
        c.showPage()
    c.save()
    return drawn


# --- letters and reports ----------------------------------------------------------

def sections(source: str) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    name = None
    for raw in source.splitlines():
        if m := re.fullmatch(r"\[(\w+)\]", raw.strip()):
            name = m.group(1)
            out[name] = []
        elif name:
            out[name].append(raw)
    return out


def render_document(path: Path, source: str) -> list[str]:
    """A letter with a letterhead column ([colonne]) or a report with a
    label/value table ([champs]), then its body ([corps])."""
    s = sections(source)
    c = Canvas(str(path), pagesize=A4)
    c.setTitle("Document")
    drawn: list[str] = []
    y = H - 50
    for i, text in enumerate(s.get("entete", [])):
        c.setFont("Helvetica-Bold" if i == 0 else "Helvetica", 12 if i == 0 else 9)
        c.drawString(LEFT, y, text.replace("~", " "))
        drawn.append(text.replace("~", " "))
        y -= 16 if i == 0 else 12
    y -= 14
    body_x = LEFT
    if "colonne" in s:
        # Letterhead staff list on the left, the letter on the right, same rows.
        cy = y
        for text in s["colonne"]:
            style = "small-bold" if text.startswith("*") else "small"
            text = text.lstrip("*").replace("~", " ")
            c.setFont(*FONTS[style])
            c.drawString(30, cy, text)
            drawn.append(text)
            cy -= LEADING[style]
        body_x = 190
    if "champs" in s:
        for row in s["champs"]:
            if not row.strip():
                continue
            label, _, value = row.partition(":")
            value = value.strip().replace("~", " ")
            c.setFont(*FONTS["letter-bold"])
            c.drawString(LEFT, y, label.strip())
            c.setFont(*FONTS["letter"])
            c.drawString(180, y, value)
            drawn.append(value)
            y -= 15
        y -= 12
    width = RIGHT - body_x
    for text in s["corps"]:
        bold = text.startswith("*")
        style = "letter-bold" if bold else "letter"
        for line in paragraph(text.lstrip("*"), style, body_x, width):
            if y < BOTTOM:
                c.showPage()
                y = H - 50
            c.setFont(*FONTS[line.style])
            c.drawString(line.x, y, line.text)
            drawn.append(line.text)
            y -= LEADING["letter"] if line.text else 7
    c.showPage()
    c.save()
    return drawn


def build(slug: str) -> dict[str, list[str]]:
    folder = DOSSIERS / slug
    truth = json.loads((folder / "verite.json").read_text())
    planted: dict[str, list[str]] = {}
    for name, doc in truth["documents"].items():
        source = (folder / doc["source"]).read_text()
        if doc["type"] == "historique":
            drawn = render_historique(folder / name, parse_notes(source), truth["header"], truth["export"])
        else:
            drawn = render_document(folder / name, source)
        text = fold("\n".join(drawn))
        for identifier in doc["identifiers"]:
            # On one line, as the tests read it back (ignoring case and accents).
            assert fold(identifier) in text, f"{slug}/{name}: {identifier!r} not drawn on one line"
        planted[f"dossiers/{slug}/{name}"] = doc["identifiers"]
    return planted


def main() -> None:
    truth_path = DATA / "ground_truth.json"
    ground_truth = json.loads(truth_path.read_text())
    for folder in sorted(p for p in DOSSIERS.iterdir() if (p / "verite.json").exists()):
        planted = build(folder.name)
        ground_truth.update(planted)
        print(f"{folder.name}: {', '.join(planted)}")
    truth_path.write_text(json.dumps(ground_truth, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
