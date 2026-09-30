"""Decide when a low or running-out stock is worth telling someone about."""

from __future__ import annotations

import logging

from django.utils import timezone

from apps.refills import engine
from apps.refills.services import prediction as prediction_service

logger = logging.getLogger(__name__)


def evaluate(prediction) -> bool:
    """Send a notification if this prediction has got worse since the last one.

    Each medicine has an `alert_level` - the worst level already announced this
    cycle - and a notification goes out only when the current level is higher.
    So a patient hears once that stock is low, once that it is nearly gone, once
    that it has run out, and never a fourth time for the same shortfall. The
    level resets when stock recovers, so the next cycle starts fresh.

    Returns whether anything was sent.
    """
    if prediction is None:
        return False

    from apps.notifications.services import dispatcher

    medicine = prediction.medicine
    level = engine.STATUS_LEVEL.get(prediction.status, 0)

    # No schedule means no forecast, but a nearly empty box is still worth a word.
    if prediction.status == engine.UNKNOWN and medicine.is_low_stock:
        level = 1
        if level > prediction.alert_level:
            dispatcher.notify_low_stock(medicine)
            _mark(prediction, level)
            return True
        return False

    if level == 0 or level <= prediction.alert_level:
        return False

    dispatcher.notify_refill(
        medicine, prediction, prediction_service.message_for(medicine, prediction)
    )
    _mark(prediction, level)
    return True


def _mark(prediction, level: int) -> None:
    prediction.alert_level = level
    prediction.last_alerted_at = timezone.now()
    prediction.save(update_fields=["alert_level", "last_alerted_at", "updated_at"])


def after_stock_change(medicine, *, notify: bool = True):
    """Recompute after anything that changes stock or the schedule, then maybe alert."""
    prediction = prediction_service.recompute(medicine)
    if notify:
        evaluate(prediction)
    return prediction
