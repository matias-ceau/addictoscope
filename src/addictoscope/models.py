"""Data model for the frise chronologique (timeline).

Mirrors the paper template's swimlane structure (Auriacombe et al. 2018,
Ann Med Psycho 176:746-749): a fixed set of track kinds, but an open number
of tracks per kind per patient (the paper's "Psychopatho 1/2",
"Médicaments 1/2", "Autre" slots are a paper-space constraint, not a
clinical one).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from enum import Enum


class TrackKind(Enum):
    LIFE_EVENT = "life_event"
    SOMATIC = "somatic"
    PSYCHIATRIC = "psychiatric"
    SUBSTANCE_USE = "substance_use"
    THERAPEUTIC_PSYCHO = "therapeutic_psycho"
    MEDICATION = "medication"


class UsageMode(Enum):
    """State of a SUBSTANCE_USE track event.

    TODO(clinical review): mirrors the template's "usage/intox/sevrage/
    rechute/craving" wording verbatim. Confirm this partition holds, e.g.
    whether craving is a state exclusive with usage or a co-occurring
    symptom that can overlap another mode.
    """
    USAGE = "usage"
    INTOXICATION = "intoxication"
    SEVRAGE = "sevrage"
    RECHUTE = "rechute"
    CRAVING = "craving"


@dataclass
class SourceRef:
    """Traceability back to the original note, for clinician verification."""

    document: str
    excerpt: str | None = None


@dataclass
class Track:
    id: str
    kind: TrackKind
    label: str  # e.g. "Alcool", "Trouble bipolaire", "Naltrexone"


@dataclass
class Event:
    """An interval on a track. A point-in-time event has end_date=None and
    ongoing=False; an open-ended one (still active) has ongoing=True."""

    id: str
    track_id: str
    start_date: date
    end_date: date | None = None
    ongoing: bool = False
    mode: UsageMode | None = None  # only meaningful for SUBSTANCE_USE tracks
    note: str = ""
    source: SourceRef | None = None


@dataclass
class LossOfControlMarker:
    """A loss-of-control moment identified within a usage Event, kept
    distinct from that event's start/end so it can be dated independently."""

    event_id: str
    date: date
    note: str = ""
    source: SourceRef | None = None


@dataclass
class Timeline:
    patient_ref: str  # pseudonym/id only, never a real name
    tracks: list[Track] = field(default_factory=list)
    events: list[Event] = field(default_factory=list)
    loss_of_control_markers: list[LossOfControlMarker] = field(default_factory=list)
