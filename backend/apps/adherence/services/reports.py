"""Load dose history and turn it into adherence summaries and reports."""

from __future__ import annotations

import csv
import io
from datetime import date, datetime, time, timedelta

from django.utils import timezone

from apps.adherence import engine
from apps.common.choices import DoseStatus
from apps.reminders.models import DoseEvent

#: How far back streaks look. A streak longer than this is reported as this.
STREAK_LOOKBACK_DAYS = 180
PERIODS = {"weekly": 7, "monthly": 30}


def load_records(patients, start: date, end: date, *, medicine=None) -> list[engine.Record]:
    """Dose events in [start, end] (local days) as plain records.

    Reads bare column values rather than model instances: a month of history is
    hundreds of rows, and building a Django object (plus its medicine) for each
    was most of the time this endpoint spent. The patient filter is resolved to a
    list of ids first, because `accessible_patient_profiles()` is a multi-join
    OR query and the database re-runs it as a subquery on every filtered scan.
    """
    if hasattr(patients, "values_list"):
        patients = list(patients.values_list("pk", flat=True))
    tz_start = timezone.make_aware(datetime.combine(start, time.min))
    tz_end = timezone.make_aware(datetime.combine(end + timedelta(days=1), time.min))
    queryset = DoseEvent.objects.filter(
        patient_id__in=patients,
        scheduled_for__gte=tz_start,
        scheduled_for__lt=tz_end,
        status__in=[DoseStatus.TAKEN, DoseStatus.MISSED, DoseStatus.SKIPPED],
    )
    if medicine is not None:
        queryset = queryset.filter(medicine=medicine)

    records = []
    rows = queryset.values_list(
        "scheduled_for", "status", "slot", "responded_at", "medicine__brand_name", "medicine__name"
    )
    for scheduled_for, status, slot, responded_at, brand, name in rows:
        delay = None
        if status == DoseStatus.TAKEN and responded_at:
            delay = (responded_at - scheduled_for).total_seconds() / 60
        records.append(
            engine.Record(
                day=timezone.localtime(scheduled_for).date(),
                slot=slot,
                status=status,
                medicine=brand or name,
                delay_minutes=delay,
            )
        )
    return records


def _range(days: int, today: date | None = None) -> tuple[date, date]:
    end = today or timezone.localdate()
    return end - timedelta(days=days - 1), end


def _summary_of(all_records: list[engine.Record], days: int, today: date | None) -> dict:
    start, end = _range(days, today)
    window = [r for r in all_records if start <= r.day <= end]
    result = engine.summarise(all_records, start, end, streak_records=all_records)
    result["daily"] = engine.daily_series(window, start, end)
    result["missed_analysis"] = engine.missed_analysis(window)
    return result


def summaries(patients, windows: tuple[int, ...], *, today: date | None = None) -> dict[int, dict]:
    """Several windows (e.g. 7 and 30 days) from a single read of the history.

    The dashboard needs both; computing them separately would read the same
    180 days of doses twice.
    """
    end = today or timezone.localdate()
    records = load_records(patients, end - timedelta(days=STREAK_LOOKBACK_DAYS), end)
    return {days: _summary_of(records, days, today) for days in windows}


def summary(patients, days: int = 30, *, today: date | None = None, medicine=None) -> dict:
    """The adherence screen: headline numbers, daily series and missed-dose patterns."""
    end = today or timezone.localdate()
    records = load_records(
        patients, end - timedelta(days=STREAK_LOOKBACK_DAYS), end, medicine=medicine
    )
    return _summary_of(records, days, today)


def report(patients, period: str, *, today: date | None = None) -> dict:
    """A weekly or monthly report, with the period before it for comparison."""
    if period not in PERIODS:
        raise ValueError(f"Unknown period {period!r}")
    days = PERIODS[period]
    start, end = _range(days, today)
    previous_start, previous_end = start - timedelta(days=days), start - timedelta(days=1)

    records = load_records(patients, previous_start, end)
    current = engine.summarise(records, start, end)
    previous = engine.totals(engine._within(records, previous_start, previous_end))

    change = None
    if current["adherence_rate"] is not None and previous["adherence_rate"] is not None:
        change = round(current["adherence_rate"] - previous["adherence_rate"], 1)

    window = [r for r in records if start <= r.day <= end]
    return {
        "period": period,
        "generated_at": timezone.now(),
        **current,
        "previous": {
            "start": previous_start,
            "end": previous_end,
            "adherence_rate": previous["adherence_rate"],
            "taken": previous["taken"],
            "missed": previous["missed"],
        },
        "change_from_previous": change,
        "daily": engine.daily_series(window, start, end),
        "missed_analysis": engine.missed_analysis(window),
    }


CSV_COLUMNS = ["date", "taken", "missed", "skipped", "adherence_rate_percent"]


def report_csv(data: dict) -> str:
    """The report as CSV: a header block, then one row per day."""
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["PillSync adherence report"])
    writer.writerow(["period", data["period"]])
    writer.writerow(["from", data["start"].isoformat()])
    writer.writerow(["to", data["end"].isoformat()])
    writer.writerow(["taken", data["taken"]])
    writer.writerow(["missed", data["missed"]])
    writer.writerow(["skipped", data["skipped"]])
    writer.writerow(
        [
            "adherence_rate_percent",
            data["adherence_rate"] if data["adherence_rate"] is not None else "",
        ]
    )
    writer.writerow(
        ["on_time_rate_percent", data["on_time_rate"] if data["on_time_rate"] is not None else ""]
    )
    writer.writerow(["current_streak_days", data["streaks"]["current"]])
    writer.writerow([])
    writer.writerow(CSV_COLUMNS)
    for row in data["daily"]:
        rate = row["adherence_rate"]
        writer.writerow(
            [
                row["date"].isoformat(),
                row["taken"],
                row["missed"],
                row["skipped"],
                "" if rate is None else rate,
            ]
        )
    return buffer.getvalue()
