"""Strip the fixed per-page header/footer (the "encart") that CSAPA exports
reprint on every page, and reflow pages into one continuous text.

The header repeats verbatim (patient identity bandeau, hospital address,
admission/UF lines) on every page and sometimes lands mid-sentence, cutting
an observation's body text in two. Stripping it line-by-line and
concatenating what remains lets an observation read as one continuous block
regardless of where the original page breaks fell.
"""
from __future__ import annotations

import re

_NOISE_LINE_PATTERNS = [
    r"^CH CHARLES PERRENS$",
    r"^121, rue de la Bechade$",
    r"^CS 81285$",
    r"^33076 BORDEAUX CEDEX$",
    r"^Tel\. [\d.]+\s+Finess\s+[\d ]+\d$",
    r"^Siret\s+[\d ]+\d$",
    r"^FICHE D'OBSERVATIONS$",
    r"^Né\(e\) le \d{2}/\d{2}/\d{4}\b",
    r"^IPP \d+",
    r"^Poids \d+",
    r"^Taille \d+",
    r"^IMC\b",
    r"^SC\b",
    r".+ Admission [A-Z]?\d+ Méd\. .+$",
    r"^(lun|mar|mer|jeu|ven|sam|dim)\.\s\d{2}/\d{2}/\d{2}\s\d{2}:\d{2}.*\bUF[MH]\b",
    r"^Edité le \d{2}/\d{2}/\d{4} \d{2}:\d{2} par .+ Page \d+\s?/\d+$",
    r"^Page \d+\s?/\d+$",
]
_NOISE_LINE_RE = re.compile("|".join(_NOISE_LINE_PATTERNS))


def strip_page_noise(page_text: str) -> str:
    """Remove header/footer lines from a single page's text."""
    kept = [line for line in page_text.split("\n") if not _NOISE_LINE_RE.match(line)]
    return "\n".join(kept)


def clean_document(pages: list[str]) -> str:
    """Strip noise from every page and join into one continuous text."""
    return "\n".join(strip_page_noise(page) for page in pages)
