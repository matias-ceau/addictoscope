"""Segment a cleaned CSAPA document into structured observation entries.

Each entry's title line carries the true clinical date ("Observation ... du
DD/MM/YYYY") — never the validation/modification date on the line below it,
and never the admission date printed in the (already-stripped) page header.

The rédacteur's fonction (role) is only explicit on the status line for a
minority of entries. When absent it is resolved in two further passes:
first from the type_label when that label names an unambiguous role (IDE,
diététicienne, éducateur spécialisé, AS/ASS, Cadre de Santé), then — for the
remaining, role-ambiguous type_labels (e.g. "psychiatrique de suivi",
"SECOP") — by cross-referencing what fonction that same author's other
entries in this batch already resolved to.
"""
from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime

_TITLE_RE = re.compile(
    r"^Observation (?P<type>.+?) du (?P<date>\d{2}/\d{2}/\d{4})"
    r"(?: \(Urgence\s*:\s*(?P<urgency>[^)]+)\))?\s*$",
    re.MULTILINE,
)
_STATUS_MODIFIED_RE = re.compile(
    r"^Dernière modification le (?P<date>\d{2}/\d{2}/\d{4}) à (?P<time>\d{2}:\d{2})"
    r" par (?P<name>.+?) - (?P<fonction>.+)$"
)
_STATUS_MANUAL_RE = re.compile(
    r"^Validé par (?P<name>.+?) - (?P<fonction>.+?)"
    r" le (?P<date>\d{2}/\d{2}/\d{4}) à (?P<time>\d{2}:\d{2})$"
)
_STATUS_AUTO_RE = re.compile(
    r"^Validé automatiquement le (?P<date>\d{2}/\d{2}/\d{4}) à (?P<time>\d{2}:\d{2})"
    r" par (?P<name>.+)$"
)

# TODO(clinical review): confirm these type_label -> fonction mappings.
_TYPE_TO_FONCTION = {
    "ide": "Infirmier(ère)",
    "diététicienne": "Diététicienne",
    "éducateur spécialisé": "Educateur spécialisé",
    "as": "Assistants sociaux",
    "ass": "Assistants sociaux",
    "cadre de santé": "Cadre de Santé",
}


@dataclass
class RawObservation:
    type_label: str
    date: date
    urgency: str | None
    author: str | None
    fonction: str | None
    fonction_source: str | None  # "explicit" | "type_label" | "cross_reference" | "unresolved"
    validated_at: datetime | None
    body: str
    source_document: str


def _parse_datetime(date_str: str, time_str: str) -> datetime:
    return datetime.strptime(f"{date_str} {time_str}", "%d/%m/%Y %H:%M")


def parse_observations(cleaned_text: str, source_document: str) -> list[RawObservation]:
    titles = list(_TITLE_RE.finditer(cleaned_text))
    entries = []

    for i, title_match in enumerate(titles):
        start = title_match.end()
        end = titles[i + 1].start() if i + 1 < len(titles) else len(cleaned_text)
        lines = cleaned_text[start:end].split("\n")

        idx = 0
        while idx < len(lines) and not lines[idx].strip():
            idx += 1
        status_line = lines[idx].strip() if idx < len(lines) else ""

        author = fonction = fonction_source = validated_at = None
        body_lines = lines[idx + 1 :]

        if status_match := _STATUS_MODIFIED_RE.match(status_line):
            author = status_match["name"].strip()
            fonction = status_match["fonction"].strip()
            fonction_source = "explicit"
            validated_at = _parse_datetime(status_match["date"], status_match["time"])
        elif status_match := _STATUS_MANUAL_RE.match(status_line):
            author = status_match["name"].strip()
            fonction = status_match["fonction"].strip()
            fonction_source = "explicit"
            validated_at = _parse_datetime(status_match["date"], status_match["time"])
        elif status_match := _STATUS_AUTO_RE.match(status_line):
            author = status_match["name"].strip()
            validated_at = _parse_datetime(status_match["date"], status_match["time"])
        else:
            body_lines = lines[idx:]  # no recognized status line: keep it as body

        entries.append(
            RawObservation(
                type_label=title_match["type"].strip(),
                date=datetime.strptime(title_match["date"], "%d/%m/%Y").date(),
                urgency=title_match["urgency"].strip() if title_match["urgency"] else None,
                author=author,
                fonction=fonction,
                fonction_source=fonction_source,
                validated_at=validated_at,
                body="\n".join(body_lines).strip(),
                source_document=source_document,
            )
        )

    return entries


def resolve_fonctions(entries: list[RawObservation]) -> list[RawObservation]:
    """Fill in missing fonctions in place, tier 2 (type_label) then tier 3
    (cross-reference by author), and return the same list for convenience."""
    for entry in entries:
        if entry.fonction is None:
            mapped = _TYPE_TO_FONCTION.get(entry.type_label.strip().lower())
            if mapped:
                entry.fonction = mapped
                entry.fonction_source = "type_label"

    known_fonctions_by_author: dict[str, set[str]] = defaultdict(set)
    for entry in entries:
        if entry.fonction is not None and entry.author:
            known_fonctions_by_author[entry.author].add(entry.fonction)

    for entry in entries:
        if entry.fonction is not None:
            continue
        candidates = known_fonctions_by_author.get(entry.author or "", set())
        if len(candidates) == 1:
            entry.fonction = next(iter(candidates))
            entry.fonction_source = "cross_reference"
        else:
            entry.fonction_source = "unresolved"

    return entries
