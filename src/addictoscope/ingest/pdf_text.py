"""Per-page text extraction from a CSAPA "fiche d'observations" PDF export."""
from __future__ import annotations

from pathlib import Path

import pdfplumber


def extract_pages(pdf_path: str | Path) -> list[str]:
    """Return one text block per PDF page, in document order."""
    with pdfplumber.open(pdf_path) as pdf:
        return [page.extract_text() or "" for page in pdf.pages]
