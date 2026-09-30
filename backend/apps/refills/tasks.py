"""Scheduled refill work."""

from __future__ import annotations

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name="refills.recompute_predictions")
def recompute_predictions() -> int:
    """Refresh every forecast and send any alert that has come due.

    Stock only changes on a dose or a refill, but the forecast also moves with
    the calendar - a medicine that was fine yesterday is a day closer to running
    out today - so the nightly run is what turns "5 days left" into a message.
    """
    from apps.medications.models import Medicine
    from apps.refills.services import alerts

    count = 0
    for medicine in Medicine.objects.filter(is_active=True).prefetch_related("schedules"):
        try:
            alerts.after_stock_change(medicine, notify=True)
            count += 1
        except Exception:  # noqa: BLE001 - one bad medicine must not stop the rest
            logger.exception("Refill prediction failed for medicine %s", medicine.pk)
    logger.info("Recomputed %d refill predictions", count)
    return count
