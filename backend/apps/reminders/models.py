"""Scheduled doses — the reminder queue and the medication history in one table.

A `DoseEvent` is created ahead of time for every dose a schedule says is due.
Before its time it is the reminder; after it, it is the history record. Keeping
them as one row means "what did the patient actually do about the 08:00 dose on
Tuesday" has exactly one answer, which is what Milestone 3's adherence
percentages are computed from.
"""

from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.common.choices import DoseSlot, DoseStatus
from apps.common.models import UUIDTimeStampedModel

# How long after its scheduled time a dose stays actionable before the sweeper
# records it as missed. Long enough to cover a patient who takes a tablet late,
# short enough that "missed" still means something.
MISSED_AFTER = timedelta(hours=4)

# A snooze that could be repeated forever would let a dose never resolve.
MAX_SNOOZES = 3
SNOOZE_MINUTES = 15


class DoseEventQuerySet(models.QuerySet):
    def for_patient(self, patient):
        return self.filter(patient=patient)

    def pending(self):
        return self.filter(status__in=[DoseStatus.PENDING, DoseStatus.SNOOZED])

    def due_now(self, now=None):
        """Doses whose reminder should go out, snoozes included."""
        now = now or timezone.now()
        return self.filter(status=DoseStatus.PENDING, scheduled_for__lte=now) | self.filter(
            status=DoseStatus.SNOOZED, snooze_until__lte=now
        )

    def overdue(self, now=None):
        now = now or timezone.now()
        return self.filter(
            status__in=[DoseStatus.PENDING, DoseStatus.SNOOZED],
            scheduled_for__lt=now - MISSED_AFTER,
        )

    def on_day(self, day):
        return self.filter(scheduled_for__date=day)

    def resolved(self):
        return self.filter(status__in=[DoseStatus.TAKEN, DoseStatus.MISSED, DoseStatus.SKIPPED])


class DoseEvent(UUIDTimeStampedModel):
    schedule = models.ForeignKey(
        "medications.MedicationSchedule",
        on_delete=models.CASCADE,
        related_name="dose_events",
    )
    # Denormalised from schedule.medicine.patient so the history of a patient
    # survives a schedule being deleted, and so the common queries - today's
    # doses, this month's history - need no joins.
    medicine = models.ForeignKey(
        "medications.Medicine", on_delete=models.CASCADE, related_name="dose_events"
    )
    patient = models.ForeignKey(
        "profiles.PatientProfile", on_delete=models.CASCADE, related_name="dose_events"
    )

    scheduled_for = models.DateTimeField(db_index=True)
    slot = models.CharField(max_length=16, choices=DoseSlot.choices, default=DoseSlot.MORNING)
    quantity_expected = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("1"))

    status = models.CharField(
        max_length=16, choices=DoseStatus.choices, default=DoseStatus.PENDING, db_index=True
    )
    responded_at = models.DateTimeField(null=True, blank=True)
    quantity_taken = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    snooze_until = models.DateTimeField(null=True, blank=True)
    snooze_count = models.PositiveSmallIntegerField(default=0)

    reminder_sent_at = models.DateTimeField(null=True, blank=True)
    caregiver_alerted_at = models.DateTimeField(null=True, blank=True)
    notes = models.CharField(max_length=255, blank=True)

    objects = DoseEventQuerySet.as_manager()

    class Meta:
        ordering = ("scheduled_for",)
        verbose_name = _("dose event")
        constraints = [
            # Regenerating the horizon must never double up a dose.
            models.UniqueConstraint(
                fields=["schedule", "scheduled_for"], name="uniq_dose_per_schedule_time"
            ),
        ]
        indexes = [
            models.Index(fields=["patient", "scheduled_for"]),
            models.Index(fields=["patient", "status", "scheduled_for"]),
            models.Index(fields=["status", "scheduled_for"]),
        ]

    def __str__(self) -> str:
        return f"{self.medicine.name} at {self.scheduled_for:%Y-%m-%d %H:%M} ({self.status})"

    # -- state -------------------------------------------------------------

    @property
    def is_open(self) -> bool:
        return self.status in {DoseStatus.PENDING, DoseStatus.SNOOZED}

    @property
    def is_overdue(self) -> bool:
        return self.is_open and timezone.now() > self.scheduled_for + MISSED_AFTER

    @property
    def can_snooze(self) -> bool:
        return self.is_open and self.snooze_count < MAX_SNOOZES

    @property
    def effective_time(self):
        """When this dose is next due — the snooze time once snoozed."""
        if self.status == DoseStatus.SNOOZED and self.snooze_until:
            return self.snooze_until
        return self.scheduled_for
