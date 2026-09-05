"""What happens when a patient responds to a reminder.

The specification names three actions — Taken, Missed, Snooze — plus the
implicit fourth: a dose nobody responded to eventually becomes Missed on its
own. All four live here rather than in views, because the sweeper task and the
API have to behave identically.
"""

from __future__ import annotations

import logging
from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.common.choices import DoseStatus
from apps.reminders.models import MAX_SNOOZES, SNOOZE_MINUTES, DoseEvent

logger = logging.getLogger(__name__)


@transaction.atomic
def mark_taken(dose: DoseEvent, *, quantity: Decimal | None = None, notes: str = "") -> DoseEvent:
    """Record a dose as taken and take it out of stock.

    Stock is decremented here and only here, so remaining quantity always
    reflects doses actually confirmed — which is what the Milestone 3 refill
    engine predicts from.
    """
    if not dose.is_open:
        raise ValidationError(
            {"detail": f"This dose is already recorded as {dose.get_status_display().lower()}."}
        )

    taken = quantity if quantity is not None else dose.quantity_expected
    if taken <= 0:
        raise ValidationError({"quantity_taken": "Enter how many units were taken."})

    dose.status = DoseStatus.TAKEN
    dose.quantity_taken = taken
    dose.responded_at = timezone.now()
    dose.snooze_until = None
    dose.notes = notes[:255] or dose.notes
    dose.save(
        update_fields=[
            "status",
            "quantity_taken",
            "responded_at",
            "snooze_until",
            "notes",
            "updated_at",
        ]
    )

    medicine = dose.medicine
    medicine.consume(taken)
    _maybe_warn_low_stock(medicine)

    logger.info("Dose %s taken (%s units)", dose.pk, taken)
    return dose


@transaction.atomic
def mark_missed(dose: DoseEvent, *, notes: str = "", alert_caregivers: bool = True) -> DoseEvent:
    """Record a dose as missed and let the caregivers know."""
    if not dose.is_open:
        raise ValidationError(
            {"detail": f"This dose is already recorded as {dose.get_status_display().lower()}."}
        )

    dose.status = DoseStatus.MISSED
    dose.responded_at = timezone.now()
    dose.snooze_until = None
    dose.notes = notes[:255] or dose.notes
    dose.save(update_fields=["status", "responded_at", "snooze_until", "notes", "updated_at"])

    if alert_caregivers:
        # Imported here: the notification layer imports reminder models, and a
        # module-level import would close the cycle.
        from apps.notifications.services.dispatcher import notify_missed_dose

        notify_missed_dose(dose)

    logger.info("Dose %s missed", dose.pk)
    return dose


@transaction.atomic
def mark_skipped(dose: DoseEvent, *, notes: str = "") -> DoseEvent:
    """A dose the patient deliberately did not take.

    Kept apart from Missed on purpose: "my doctor told me to stop the
    antibiotic" is not an adherence failure, and lumping the two together would
    make the Milestone 3 percentages lie.
    """
    if not dose.is_open:
        raise ValidationError(
            {"detail": f"This dose is already recorded as {dose.get_status_display().lower()}."}
        )

    dose.status = DoseStatus.SKIPPED
    dose.responded_at = timezone.now()
    dose.snooze_until = None
    dose.notes = notes[:255] or dose.notes
    dose.save(update_fields=["status", "responded_at", "snooze_until", "notes", "updated_at"])
    return dose


@transaction.atomic
def snooze(dose: DoseEvent, *, minutes: int = SNOOZE_MINUTES) -> DoseEvent:
    """Push a reminder back a few minutes.

    Capped at MAX_SNOOZES: an uncapped snooze lets a dose stay open forever,
    which is indistinguishable from being ignored but never shows up as missed.
    """
    if not dose.is_open:
        raise ValidationError(
            {"detail": f"This dose is already recorded as {dose.get_status_display().lower()}."}
        )
    if not dose.can_snooze:
        raise ValidationError(
            {
                "detail": (
                    f"This dose has already been snoozed {MAX_SNOOZES} times. "
                    "Mark it taken or missed."
                )
            }
        )
    if minutes <= 0 or minutes > 240:
        raise ValidationError({"minutes": "Snooze between 1 and 240 minutes."})

    dose.status = DoseStatus.SNOOZED
    dose.snooze_until = timezone.now() + timedelta(minutes=minutes)
    dose.snooze_count += 1
    dose.save(update_fields=["status", "snooze_until", "snooze_count", "updated_at"])

    logger.info(
        "Dose %s snoozed for %d minutes (%d/%d)", dose.pk, minutes, dose.snooze_count, MAX_SNOOZES
    )
    return dose


def sweep_overdue(*, now=None, alert_caregivers: bool = True) -> int:
    """Close out doses nobody responded to.

    Without this a forgotten dose sits PENDING forever and never counts against
    adherence — the platform would quietly report perfect compliance for a
    patient who stopped using it.
    """
    now = now or timezone.now()
    overdue = list(
        DoseEvent.objects.overdue(now).select_related("medicine", "patient", "patient__managed_by")
    )

    for dose in overdue:
        try:
            mark_missed(dose, alert_caregivers=alert_caregivers)
        except ValidationError:
            # Someone responded between the query and now. Their answer wins.
            continue

    if overdue:
        logger.info("Swept %d overdue doses to missed", len(overdue))
    return len(overdue)


def _maybe_warn_low_stock(medicine) -> None:
    """Raise a low-stock notification once the pack runs down."""
    if not medicine.is_low_stock:
        return
    from apps.notifications.services.dispatcher import notify_low_stock

    notify_low_stock(medicine)
