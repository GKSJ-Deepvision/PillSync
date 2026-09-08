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
    instructions = models.TextField(blank=True)
    quantity_remaining = models.PositiveIntegerField(default=0)
    refill_threshold = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_active", "name"]

    def __str__(self):
        return f"{self.name} ({self.dosage})"


class MedicationSchedule(models.Model):
    class TimeOfDay(models.TextChoices):
        MORNING = "morning", "Morning"
        AFTERNOON = "afternoon", "Afternoon"
        EVENING = "evening", "Evening"
        NIGHT = "night", "Night"

    medication = models.ForeignKey(Medication, on_delete=models.CASCADE, related_name="schedules")
    time_of_day = models.CharField(max_length=20, choices=TimeOfDay.choices)
    exact_time = models.TimeField()
    days_of_week = models.JSONField(default=list)
    dose_amount = models.DecimalField(
        max_digits=8, decimal_places=2, validators=[MinValueValidator(0.01)]
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
