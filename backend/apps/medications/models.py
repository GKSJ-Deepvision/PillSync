from datetime import date, timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.profiles.models import PatientProfile

from .choices import DoseSlot, MedicineCategory, ScheduleFrequency, Weekday


class Medicine(models.Model):
    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name="medicines",
    )
    name = models.CharField(max_length=255)
    brand_name = models.CharField(max_length=255, blank=True)
    dosage_form = models.CharField(max_length=128, blank=True)
    strength = models.CharField(max_length=64, blank=True)
    strength_unit = models.CharField(max_length=64, blank=True)

    category = models.CharField(
        max_length=32,
        choices=MedicineCategory.choices,
        default=MedicineCategory.OTHER,
        db_index=True,
    )

    instructions = models.CharField(max_length=255, blank=True)

    quantity_remaining = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal("0"),
        validators=[MinValueValidator(Decimal("0"))],
    )
    quantity_per_refill = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0"))],
    )
    low_stock_threshold = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal("5"),
        validators=[MinValueValidator(Decimal("0"))],
    )

    start_date = models.DateField(default=date.today)
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["patient", "is_active"]),
            models.Index(fields=["patient", "category"]),
        ]

    def __str__(self):
        strength = f" {self.strength} {self.strength_unit}".strip()
        return f"{self.name} {strength}".strip()

    @property
    def display_name(self):
        return self.brand_name or self.name

    @property
    def is_low_stock(self):
        return self.quantity_remaining <= self.low_stock_threshold

    @property
    def is_out_of_stock(self):
        return self.quantity_remaining <= 0

    def is_running_on(self, day):
        if not self.is_active:
            return False
        if day < self.start_date:
            return False
        return self.end_date is None or day <= self.end_date

    def consume(self, quantity):
        quantity = Decimal(str(quantity))
        if quantity <= 0:
            raise ValueError("Quantity must be greater than zero.")

        removed = min(self.quantity_remaining, quantity)
        self.quantity_remaining -= removed
        self.save(update_fields=["quantity_remaining", "updated_at"])
        return removed

    def restock(self, quantity):
        quantity = Decimal(str(quantity))
        if quantity <= 0:
            raise ValueError("Quantity must be greater than zero.")

        self.quantity_remaining += quantity
        self.save(update_fields=["quantity_remaining", "updated_at"])


class Dosage(models.Model):
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name="dosages",
    )
    amount = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    unit = models.CharField(max_length=32, default="tablet")
    instructions = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.medicine.name} - {self.amount} {self.unit}"


class MedicationSchedule(models.Model):
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name="schedules",
    )
    dosage = models.ForeignKey(
        Dosage,
        on_delete=models.CASCADE,
        related_name="schedules",
        null=True,
        blank=True,
    )

    slot = models.CharField(
        max_length=16,
        choices=DoseSlot.choices,
        default=DoseSlot.MORNING,
    )
    time_of_day = models.TimeField()

    quantity_per_dose = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal("1"),
        validators=[MinValueValidator(Decimal("0.01"))],
    )

    frequency = models.CharField(
        max_length=20,
        choices=ScheduleFrequency.choices,
        default=ScheduleFrequency.DAILY,
    )
    days_of_week = models.JSONField(default=list, blank=True)
    interval_days = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(365)],
    )

    start_date = models.DateField(default=date.today)
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    reminder_enabled = models.BooleanField(default=True)
    remind_minutes_before = models.PositiveSmallIntegerField(
        default=0,
        validators=[MaxValueValidator(180)],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["time_of_day"]
        constraints = [
            models.UniqueConstraint(
                fields=["medicine", "time_of_day", "slot"],
                name="uniq_schedule_per_medicine_time",
            )
        ]

    def __str__(self):
        return f"{self.medicine.name} - " f"{self.quantity_per_dose} at {self.time_of_day:%H:%M}"

    def clean(self):
        if self.end_date and self.end_date < self.start_date:
            raise ValidationError({"end_date": "End date cannot be before start date."})

        if self.frequency == ScheduleFrequency.SPECIFIC_DAYS:
            days = self.days_of_week or []

            if not days:
                raise ValidationError({"days_of_week": "Choose at least one day."})

            if any(day not in Weekday.values for day in days):
                raise ValidationError({"days_of_week": "Days must be ISO weekday numbers 1-7."})

    def occurs_on(self, day):
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

    def next_occurrence(self, after=None):
        cursor = after or date.today()

        for _ in range(366):
            if self.occurs_on(cursor):
                return cursor
            cursor += timedelta(days=1)

        return None
