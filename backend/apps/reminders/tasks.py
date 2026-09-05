"""The background loop that makes reminders happen.

Four tasks, run by Celery beat:

* ``generate_dose_events`` keeps the horizon topped up (nightly)
* ``dispatch_due_reminders`` sends what is due (every minute)
* ``sweep_overdue_doses`` closes out what nobody answered (every 15 minutes)
* ``notify_expiring_prescriptions`` warns before a prescription runs out (daily)

Each is idempotent and safe to run twice: beat can double-fire after a restart,
and a reminder sent twice is worse than one sent late.
"""

from __future__ import annotations

import logging

from celery import shared_task
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

#: Warn this many days before a prescription expires.
PRESCRIPTION_EXPIRY_WARNING_DAYS = 7


@shared_task(name="reminders.generate_dose_events")
def generate_dose_events(horizon_days: int | None = None) -> int:
    """Materialise upcoming doses for every active schedule."""
    from apps.reminders.services.generation import generate_all

    horizon = horizon_days or getattr(settings, "DOSE_HORIZON_DAYS", 14)
    created = generate_all(horizon_days=horizon)
    logger.info("generate_dose_events created %d dose events", created)
    return created


@shared_task(name="reminders.dispatch_due_reminders")
def dispatch_due_reminders(limit: int = 500) -> int:
    """Send reminders for doses that have come due.

    ``reminder_sent_at`` is the guard against re-sending: a dose stays PENDING
    until the patient responds, so without it every run would remind again.
    Snoozed doses are the exception - the whole point of a snooze is a second
    reminder - so they are matched on ``snooze_until`` instead.
    """
    from apps.common.choices import DoseStatus
    from apps.notifications.services.dispatcher import notify_dose_due
    from apps.reminders.models import DoseEvent

    now = timezone.now()

    first_time = DoseEvent.objects.filter(
        status=DoseStatus.PENDING,
        scheduled_for__lte=now,
        reminder_sent_at__isnull=True,
    )
    resnooze = DoseEvent.objects.filter(
        status=DoseStatus.SNOOZED,
        snooze_until__lte=now,
    )

    due = (
        (first_time | resnooze)
        .select_related("medicine", "patient", "patient__user", "patient__managed_by")
        .distinct()
        .order_by("scheduled_for")[:limit]
    )

    sent = 0
    for dose in due:
        try:
            if notify_dose_due(dose):
                sent += 1
        except Exception:  # noqa: BLE001 - one bad recipient must not stop the batch
            logger.exception("Failed to send reminder for dose %s", dose.pk)

    logger.info("dispatch_due_reminders sent %d of %d due", sent, len(due))
    return sent


@shared_task(name="reminders.sweep_overdue_doses")
def sweep_overdue_doses() -> int:
    """Mark unanswered doses missed, alerting caregivers."""
    from apps.reminders.services.actions import sweep_overdue

    return sweep_overdue()


@shared_task(name="reminders.notify_expiring_prescriptions")
def notify_expiring_prescriptions(days_ahead: int = PRESCRIPTION_EXPIRY_WARNING_DAYS) -> int:
    """Warn about prescriptions expiring soon, once each."""
    from datetime import timedelta

    from apps.common.choices import PrescriptionStatus
    from apps.notifications.services.dispatcher import notify_prescription_expiring
    from apps.prescriptions.models import Prescription

    today = timezone.localdate()
    horizon = today + timedelta(days=days_ahead)

    expiring = Prescription.objects.filter(
        status=PrescriptionStatus.ACTIVE,
        expires_on__isnull=False,
        expires_on__gte=today,
        expires_on__lte=horizon,
        expiry_reminded_at__isnull=True,
    ).select_related("patient", "patient__user", "patient__managed_by")

    warned = 0
    for prescription in expiring:
        try:
            if notify_prescription_expiring(prescription, prescription.days_until_expiry(today)):
                warned += 1
        except Exception:  # noqa: BLE001
            logger.exception("Failed to warn about prescription %s", prescription.pk)

    # Separately, retire the ones that have already lapsed.
    lapsed = Prescription.objects.filter(status=PrescriptionStatus.ACTIVE, expires_on__lt=today)
    lapsed_count = lapsed.update(status=PrescriptionStatus.EXPIRED)

    logger.info("notify_expiring_prescriptions warned %d, expired %d", warned, lapsed_count)
    return warned
