"""Turn schedules into concrete dose events.

A schedule is a rule ("2 tablets at 08:00 daily"); a dose event is one dated
instance of it. Materialising them ahead of time rather than computing on the
fly is what makes the rest of the platform simple: a reminder is a row to send,
adherence is a count of rows, and a patient marking Tuesday's dose taken has
somewhere to record it.

Generation is idempotent — a unique constraint on (schedule, scheduled_for)
plus an explicit existence check means running it twice, or extending the
horizon, never duplicates a dose.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.db import transaction
from django.utils import timezone

from apps.medications.models import MedicationSchedule
from apps.reminders.models import DoseEvent

logger = logging.getLogger(__name__)

#: How far ahead doses are created. Long enough that a patient can see the week
#: ahead, short enough that editing a schedule does not orphan months of rows.
DEFAULT_HORIZON_DAYS = 14


def patient_timezone(patient) -> ZoneInfo:
    """The patient's own timezone, falling back to the server's.

    An 08:00 dose means 08:00 where the patient is. Getting this wrong sends
    reminders in the middle of the night to anyone who travels.
    """
    try:
        return ZoneInfo(patient.timezone_name or "UTC")
    except (ZoneInfoNotFoundError, ValueError):
        logger.warning(
            "Patient %s has an unusable timezone %r; falling back to UTC.",
            patient.pk,
            patient.timezone_name,
        )
        return ZoneInfo("UTC")


def scheduled_datetime(schedule: MedicationSchedule, day: date) -> datetime:
    """The aware datetime a dose falls due, in the patient's timezone."""
    tz = patient_timezone(schedule.medicine.patient)
    return datetime.combine(day, schedule.time_of_day, tzinfo=tz)


@transaction.atomic
def generate_for_schedule(
    schedule: MedicationSchedule,
    *,
    horizon_days: int = DEFAULT_HORIZON_DAYS,
    start: date | None = None,
) -> list[DoseEvent]:
    """Create the missing dose events for one schedule.

    Past dates are never back-filled: a schedule added today does not invent a
    history of doses the patient never had the chance to take.
    """
    if not schedule.is_active:
        return []

    today = timezone.localdate()
    first_day = max(start or today, today, schedule.start_date, schedule.medicine.start_date)
    last_day = first_day + timedelta(days=horizon_days)

    existing = set(
        DoseEvent.objects.filter(
            schedule=schedule,
            scheduled_for__date__gte=first_day,
            scheduled_for__date__lte=last_day,
        ).values_list("scheduled_for", flat=True)
    )

    created: list[DoseEvent] = []
    day = first_day
    while day <= last_day:
        if schedule.occurs_on(day):
            when = scheduled_datetime(schedule, day)
            if when not in existing and when >= timezone.now() - timedelta(hours=1):
                created.append(
                    DoseEvent(
                        schedule=schedule,
                        medicine=schedule.medicine,
                        patient=schedule.medicine.patient,
                        scheduled_for=when,
                        slot=schedule.slot,
                        quantity_expected=schedule.quantity_per_dose,
                    )
                )
        day += timedelta(days=1)

    if created:
        # ignore_conflicts covers the race where two workers generate at once;
        # the unique constraint is the real guarantee.
        DoseEvent.objects.bulk_create(created, ignore_conflicts=True)
        logger.info("Generated %d dose events for schedule %s", len(created), schedule.pk)
    return created


def generate_for_medicine(medicine, *, horizon_days: int = DEFAULT_HORIZON_DAYS) -> int:
    total = 0
    for schedule in medicine.schedules.filter(is_active=True).select_related("medicine__patient"):
        total += len(generate_for_schedule(schedule, horizon_days=horizon_days))
    return total


def generate_all(*, horizon_days: int = DEFAULT_HORIZON_DAYS) -> int:
    """Top up the horizon for every active schedule on the platform."""
    schedules = MedicationSchedule.objects.filter(
        is_active=True, medicine__is_active=True
    ).select_related("medicine", "medicine__patient")

    total = 0
    for schedule in schedules:
        total += len(generate_for_schedule(schedule, horizon_days=horizon_days))
    return total


def drop_future_events(schedule: MedicationSchedule) -> int:
    """Remove not-yet-due doses for a schedule that changed or was disabled.

    Only untouched future doses go: anything the patient already acted on is
    history and stays, and a dose due in the next few minutes may already have
    had its reminder sent.
    """
    from apps.common.choices import DoseStatus

    deleted, _ = DoseEvent.objects.filter(
        schedule=schedule,
        status=DoseStatus.PENDING,
        scheduled_for__gt=timezone.now(),
        reminder_sent_at__isnull=True,
    ).delete()
    return deleted


def regenerate_for_schedule(
    schedule: MedicationSchedule, *, horizon_days: int = DEFAULT_HORIZON_DAYS
) -> tuple[int, int]:
    """Rebuild the future for a schedule the patient just edited.

    Returns (dropped, created).
    """
    dropped = drop_future_events(schedule)
    created = len(generate_for_schedule(schedule, horizon_days=horizon_days))
    return dropped, created
