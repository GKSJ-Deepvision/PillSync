from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Medication(models.Model):
    class Category(models.TextChoices):
        BLOOD_PRESSURE = "blood_pressure", "Blood Pressure"
        DIABETES = "diabetes", "Diabetes"
        THYROID = "thyroid", "Thyroid"
        ANTIBIOTICS = "antibiotics", "Antibiotics"
        VITAMINS = "vitamins", "Vitamins"
        HEART = "heart", "Heart Medications"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        DISCONTINUED = "discontinued", "Discontinued"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="medications",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=200)
    disease_category = models.CharField(
        max_length=40, choices=Category.choices, default=Category.OTHER
    )
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=100)
    instructions = models.TextField(blank=True, default="")
    quantity_remaining = models.PositiveIntegerField(default=30)
    refill_threshold = models.PositiveIntegerField(default=5)
    is_active = models.BooleanField(default=True)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_active", "name"]

    def __str__(self):
        return f"{self.name} ({self.dosage})"

    @property
    def user(self):
        return self.owner

    @user.setter
    def user(self, val):
        self.owner = val

    @property
    def disease(self):
        return self.get_disease_category_display()

    @property
    def quantity(self):
        return self.quantity_remaining

    @quantity.setter
    def quantity(self, val):
        self.quantity_remaining = max(0, val)

    @property
    def status(self):
        return "active" if self.is_active else "completed"


class MedicationSchedule(models.Model):
    class TimeOfDay(models.TextChoices):
        MORNING = "morning", "Morning"
        AFTERNOON = "afternoon", "Afternoon"
        EVENING = "evening", "Evening"
        NIGHT = "night", "Night"

    medication = models.ForeignKey(Medication, on_delete=models.CASCADE, related_name="schedules")
    time_of_day = models.CharField(
        max_length=20, choices=TimeOfDay.choices, default=TimeOfDay.MORNING
    )
    exact_time = models.TimeField()
    days_of_week = models.JSONField(default=list)
    dose_amount = models.DecimalField(
        max_digits=8, decimal_places=2, default=Decimal("1.00"), validators=[MinValueValidator(Decimal("0.01"))]
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["exact_time", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["medication", "time_of_day", "exact_time"],
                name="unique_medication_schedule_time",
            )
        ]

    def __str__(self):
        return f"{self.medication.name} - {self.time_of_day} at {self.exact_time}"

    @property
    def scheduled_time(self):
        return self.exact_time

    @scheduled_time.setter
    def scheduled_time(self, val):
        self.exact_time = val

    @property
    def window(self):
        return self.time_of_day.capitalize()

    @window.setter
    def window(self, val):
        self.time_of_day = val.lower() if val else "morning"


# Backward compatibility alias
DosageSchedule = MedicationSchedule


class MedicationHistory(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        TAKEN = "taken", "Taken"
        MISSED = "missed", "Missed"
        SKIPPED = "skipped", "Skipped"
        SNOOZED = "snoozed", "Snoozed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="medication_histories",
        null=True,
        blank=True,
    )
    medication = models.ForeignKey(
        Medication,
        on_delete=models.CASCADE,
        related_name="histories",
    )
    dosage_schedule = models.ForeignKey(
        MedicationSchedule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="histories",
    )
    scheduled_datetime = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    taken_datetime = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-scheduled_datetime"]
        constraints = [
            models.UniqueConstraint(
                fields=["medication", "dosage_schedule", "scheduled_datetime"],
                name="unique_medication_dose_history",
            )
        ]

    def __str__(self):
        return f"{self.medication.name} - {self.status} at {self.scheduled_datetime}"
