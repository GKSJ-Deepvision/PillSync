"""Changes to a medicine's stock that are not doses, always recorded in the ledger."""

from __future__ import annotations

from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.refills.models import StockEvent, StockEventKind
from apps.refills.services import alerts, prediction


def _record(medicine, kind: str, delta: Decimal, actor, reason: str) -> StockEvent:
    return StockEvent.objects.create(
        medicine=medicine,
        kind=kind,
        quantity_delta=delta,
        quantity_after=medicine.quantity_remaining,
        reason=reason[:255],
        actor=actor,
    )


def record_initial(medicine, actor=None) -> StockEvent:
    """Note the stock a medicine started with, and make its first prediction."""
    event = _record(
        medicine, StockEventKind.INITIAL, medicine.quantity_remaining, actor, "Starting stock"
    )
    prediction.recompute(medicine)
    return event


@transaction.atomic
def restock(medicine, quantity: Decimal, actor=None, reason: str = "") -> StockEvent:
    """The patient collected more from the pharmacy."""
    quantity = Decimal(quantity)
    if quantity <= 0:
        raise ValidationError({"quantity": "A refill must add at least one unit."})

    medicine.restock(quantity)
    event = _record(medicine, StockEventKind.REFILL, quantity, actor, reason or "Refill collected")
    alerts.after_stock_change(medicine, notify=False)
    return event


@transaction.atomic
def adjust(medicine, new_quantity: Decimal, actor=None, reason: str = "") -> StockEvent:
    """Set the stock to a counted figure.

    Stock is only ever an estimate - a patient may have loose tablets we do not
    know about, or have dropped some down the sink - so the real count is
    allowed to overrule the running total. The ledger keeps what it replaced.
    """
    new_quantity = Decimal(new_quantity)
    if new_quantity < 0:
        raise ValidationError({"quantity": "Stock cannot be negative."})

    delta = new_quantity - medicine.quantity_remaining
    medicine.quantity_remaining = new_quantity
    medicine.save(update_fields=["quantity_remaining", "updated_at"])
    event = _record(
        medicine, StockEventKind.ADJUSTMENT, delta, actor, reason or "Counted by the patient"
    )
    alerts.after_stock_change(medicine, notify=True)
    return event
