"""Refill predictions and the stock ledger behind them."""

from __future__ import annotations

from decimal import Decimal

from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import UUIDTimeStampedModel

from .engine import COVERED, CRITICAL, LOW, OK, OUT, UNKNOWN


class StockEventKind(models.TextChoices):
    INITIAL = "INITIAL", "Starting stock"
    REFILL = "REFILL", "Refill collected"
    ADJUSTMENT = "ADJUSTMENT", "Manual correction"


class StockEvent(UUIDTimeStampedModel):
    """One change to a medicine's stock that did not come from taking a dose.

    Doses already have their own record (`DoseEvent.quantity_taken`), so the
    ledger holds only the rest: what the patient started with, refills, and the
    manual "I counted 12 left" corrections the specification lists as an input.
    Without it a correction is an invisible overwrite, and a refill prediction
    that suddenly moved could not be explained.
    """

    medicine = models.ForeignKey(
        "medications.Medicine", on_delete=models.CASCADE, related_name="stock_events"
    )
    kind = models.CharField(max_length=12, choices=StockEventKind.choices)
    quantity_delta = models.DecimalField(max_digits=8, decimal_places=2)
    quantity_after = models.DecimalField(max_digits=8, decimal_places=2)
    reason = models.CharField(max_length=255, blank=True)
    actor = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("stock event")
        indexes = [models.Index(fields=["medicine", "-created_at"])]

    def __str__(self) -> str:
        return f"{self.medicine.name}: {self.quantity_delta:+g} ({self.get_kind_display()})"


class PredictionStatus(models.TextChoices):
    OK = OK, "Enough stock"
    COVERED = COVERED, "Enough for the course"
    UNKNOWN = UNKNOWN, "No schedule"
    LOW = LOW, "Running low"
    CRITICAL = CRITICAL, "Almost out"
    OUT = OUT, "Out of stock"


class RefillPrediction(UUIDTimeStampedModel):
    """The current prediction for one medicine. Recomputed, not versioned."""

    medicine = models.OneToOneField(
        "medications.Medicine", on_delete=models.CASCADE, related_name="refill_prediction"
    )
    # Denormalised so "every prediction I can see" needs no join through medicine.
    patient = models.ForeignKey(
        "profiles.PatientProfile", on_delete=models.CASCADE, related_name="refill_predictions"
    )

    computed_at = models.DateTimeField()
    status = models.CharField(max_length=10, choices=PredictionStatus.choices, db_index=True)

    remaining_stock = models.DecimalField(max_digits=8, decimal_places=2)
    scheduled_daily = models.DecimalField(max_digits=8, decimal_places=4, default=Decimal("0"))
    observed_daily = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    average_daily = models.DecimalField(max_digits=8, decimal_places=4, default=Decimal("0"))
    observed_weight = models.FloatField(default=0.0)
    sample_days = models.PositiveSmallIntegerField(default=0)
    resolved_doses = models.PositiveIntegerField(default=0)

    days_remaining = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    depletion_date = models.DateField(null=True, blank=True, db_index=True)
    recommended_refill_date = models.DateField(null=True, blank=True)
    covers_course = models.BooleanField(default=False)
    confidence = models.FloatField(
        default=0.0,
        help_text="0-1. Rises as real dose history replaces the scheduled rate.",
    )

    # The worst level already notified this cycle (0 none, 1 low, 2 critical, 3 out).
    # It only goes up while stock falls, so a patient hears about each level once,
    # and drops back to zero when stock recovers - ready for the next cycle.
    alert_level = models.PositiveSmallIntegerField(default=0)
    last_alerted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("depletion_date", "medicine__name")
        verbose_name = _("refill prediction")
        indexes = [models.Index(fields=["patient", "status"])]

    def __str__(self) -> str:
        return f"{self.medicine.name}: {self.get_status_display()}"
