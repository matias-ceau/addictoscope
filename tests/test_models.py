from datetime import date

from addictoscope.models import (
    Event,
    LossOfControlMarker,
    Timeline,
    Track,
    TrackKind,
    UsageMode,
)


def test_timeline_holds_a_relapse_interval_and_a_loss_of_control_marker():
    alcool = Track(id="t-alcool", kind=TrackKind.SUBSTANCE_USE, label="Alcool")
    relapse = Event(
        id="e-relapse-1",
        track_id=alcool.id,
        start_date=date(2024, 3, 1),
        end_date=date(2024, 3, 20),
        mode=UsageMode.RECHUTE,
    )
    marker = LossOfControlMarker(event_id=relapse.id, date=date(2024, 3, 5))

    timeline = Timeline(
        patient_ref="patient-001",
        tracks=[alcool],
        events=[relapse],
        loss_of_control_markers=[marker],
    )

    assert timeline.events[0].end_date - timeline.events[0].start_date == relapse.end_date - relapse.start_date
    assert timeline.loss_of_control_markers[0].event_id == relapse.id


def test_ongoing_event_has_no_end_date():
    event = Event(
        id="e-1",
        track_id="t-1",
        start_date=date(2024, 1, 1),
        ongoing=True,
    )

    assert event.end_date is None
    assert event.ongoing
