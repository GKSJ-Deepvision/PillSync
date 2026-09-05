"""A patient's own medicines and the schedules they are taken on."""

from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.common.choices import DoseSlot, MedicineCategory, ScheduleFrequency, Weekday
from apps.common.models import UUIDTimeStampedModel


class Medicine(UUIDTimeStampedModel):
    """One medicine a patient is actually taking.

    Distinct from `common.MedicineReference`, which is the catalogue of
    medicines that exist. This is *this patient's* box of tablets: how many are
    left, when they started, what the doctor said. Pointing at a reference row
    is optional so a patient can record something the FDA catalogue does not
    list, but when it is set the strength and category come from authoritative
    data rather than free text.
    """

    patient = models.ForeignKey(
        "profiles.PatientProfile", on_delete=models.CASCADE, related_name="medicines"
    )
    reference = models.ForeignKey(
        "common.MedicineReference",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="patient_medicines",
        help_text="Catalogue entry this medicine matches, when there is one.",
    )
    prescription = models.ForeignKey(
        "prescriptions.Prescription",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="medicines",
    )

    name = models.CharField(max_length=255, db_index=True)
    brand_name = models.CharField(max_length=255, blank=True)
    dosage_form = models.CharField(max_length=128, blank=True)
    strength = models.CharField(max_length=64, blank=True)
    strength_unit = models.CharField(max_length=64, blank=True)
    category = models.CharField(
        max_length=32,
        choices=MedicineCategory.choices,
        default=MedicineCategory.OTHER,
        db_index=True,
        help_text="Disease-based grouping, from the reference entry when there is one.",
    )
    instructions = models.CharField(
        max_length=255,
        blank=True,
        help_text="How to take it, e.g. 'after food'. Shown on every reminder.",
    )

    # --- Stock, which the refill engine reads in Milestone 3 ---
    quantity_remaining = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal("0"),
        validators=[MinValueValidator(Decimal("0"))],
        help_text="Units left in the patient's possession. Decremented when a dose is taken.",
    )
    quantity_per_refill = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0"))],
        help_text="Pack size, so a refill can restore stock in one action.",
    )
    low_stock_threshold = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal("5"),
        validators=[MinValueValidator(Decimal("0"))],
        help_text="Warn at or below this many units remaining.",
    )

    start_date = models.DateField(default=date.today)
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Last day of the course. Empty for an ongoing medicine.",
    )
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ("name",)
        verbose_name = _("medicine")
        indexes = [
            models.Index(fields=["patient", "is_active"]),
            models.Index(fields=["patient", "category"]),
        ]

    def __str__(self) -> str:
        strength = f" {self.strength} {self.strength_unit}".rstrip()
        return f"{self.name}{strength}"

    @property
    def display_name(self) -> str:
        return self.brand_name or self.name

    @property
    def is_low_stock(self) -> bool:
        return self.quantity_remaining <= self.low_stock_threshold

    @property
    def is_out_of_stock(self) -> bool:
        return self.quantity_remaining <= 0

    def is_running_on(self, day: date) -> bool:
        """Whether the course covers this date."""
        if not self.is_active:
            return False
        if day < self.start_date:
            return False
        return self.end_date is None or day <= self.end_date

    def consume(self, quantity: Decimal) -> Decimal:
        """Take `quantity` units out of stock, never going below zero.

        Returns what was actually removed. Stock can legitimately be wrong -
        a patient may have tablets we do not know about - so a dose is never
        blocked for lack of recorded stock; the count simply floors at zero.
        """
        removed = min(self.quantity_remaining, quantity)
        if removed > 0:
            self.quantity_remaining -= removed
            self.save(update_fields=["quantity_remaining", "updated_at"])
        return removed

    def restock(self, quantity: Decimal) -> None:
        self.quantity_remaining += quantity
        self.save(update_fields=["quantity_remaining", "updated_at"])


class MedicationSchedule(UUIDTimeStampedModel):
    """When and how much of a medicine to take.

    A medicine can have several: "2 tablets at 08:00 and 1 at 21:00" is two
    schedules, not one, which keeps each dose independently trackable - the
    morning dose can be taken and the evening one missed.
    """

    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name="schedules")
    slot = models.CharField(
        max_length=16,
        choices=DoseSlot.choices,
        default=DoseSlot.MORNING,
        help_text="The part of the day this dose belongs to, as the specification groups them.",
    )
    time_of_day = models.TimeField(
        help_text="Local time in the patient's timezone, not the server's.",
    )
    quantity_per_dose = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal("1"),
        validators=[MinValueValidator(Decimal("0.01"))],
    )

    frequency = models.CharField(
        max_length=16,
        choices=ScheduleFrequency.choices,
        default=ScheduleFrequency.DAILY,
    )
    days_of_week = models.JSONField(
        default=list,
        blank=True,
        help_text="For SPECIFIC_DAYS: ISO weekday numbers, Monday=1 … Sunday=7.",
    )
    interval_days = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(365)],
        help_text="For INTERVAL: take every N days, counted from start_date.",
    )

    start_date = models.DateField(default=date.today)
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    # Reminder delivery, per schedule, because a night-time dose may warrant a
    # phone call where a vitamin does not.
    reminder_enabled = models.BooleanField(default=True)
    remind_minutes_before = models.PositiveSmallIntegerField(
        default=0,
        validators=[MaxValueValidator(180)],
        help_text="Send the reminder this many minutes ahead of the dose time.",
    )

    class Meta:
        ordering = ("time_of_day",)
        verbose_name = _("medication schedule")
        constraints = [
            models.UniqueConstraint(
                fields=["medicine", "time_of_day", "slot"],
                name="uniq_schedule_per_medicine_time",
            ),
        ]
        indexes = [models.Index(fields=["medicine", "is_active"])]

    def __str__(self) -> str:
        return f"{self.medicine.name} — {self.quantity_per_dose} at {self.time_of_day:%H:%M}"

    @property
    def patient_id(self):
        return self.medicine.patient_id

    def clean(self) -> None:
        super().clean()
        from django.core.exceptions import ValidationError

        if self.frequency == ScheduleFrequency.SPECIFIC_DAYS:
            days = self.days_of_week or []
            if not days:
                raise ValidationError(
                    {"days_of_week": _("Choose at least one day for a specific-days schedule.")}
                )
            if any(day not in Weekday.values for day in days):
                raise ValidationError(
                    {"days_of_week": _("Days must be ISO weekday numbers, Monday=1 to Sunday=7.")}
                )
        if self.end_date and self.end_date < self.start_date:
            raise ValidationError({"end_date": _("The end date cannot be before the start date.")})

    def occurs_on(self, day: date) -> bool:
        """Whether a dose is due on this date."""
        if not self.is_active or not self.medicine.is_running_on(day):
            return False
        if day < self.start_date:
            return False
        if self.end_date and day > self.end_date:
            return False

        if self.frequency == ScheduleFrequency.DAILY:
            return True
        if self.frequency == ScheduleFrequency.SPECIFIC_DAYS:
            return day.isoweekday() in (self.days_of_week or [])
        if self.frequency == ScheduleFrequency.INTERVAL:
            return (day - self.start_date).days % self.interval_days == 0
        return False

    def doses_per_day(self) -> Decimal:
        """Average daily consumption, for the refill engine in Milestone 3."""
        if self.frequency == ScheduleFrequency.DAILY:
            return self.quantity_per_dose
        if self.frequency == ScheduleFrequency.SPECIFIC_DAYS:
            days = len(self.days_of_week or [])
            return self.quantity_per_dose * Decimal(days) / Decimal(7)
        if self.frequency == ScheduleFrequency.INTERVAL:
            return self.quantity_per_dose / Decimal(self.interval_days)
        return Decimal("0")

    def next_occurrence(self, after: date | None = None) -> date | None:
        """The next date this schedule fires, searching at most a year ahead."""
        cursor = after or timezone.localdate()
        for _offset in range(366):
            if self.occurs_on(cursor):
                return cursor
            cursor += timedelta(days=1)
        return None
