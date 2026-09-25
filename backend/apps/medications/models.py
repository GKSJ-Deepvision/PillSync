from django.conf import settings
from django.db import models


class Medicine(models.Model):
    class DiseaseCategory(models.TextChoices):
        BLOOD_PRESSURE = "BLOOD_PRESSURE", "Blood Pressure"
        DIABETES = "DIABETES", "Diabetes"
        THYROID = "THYROID", "Thyroid"
        ANTIBIOTICS = "ANTIBIOTICS", "Antibiotics"
        VITAMINS = "VITAMINS", "Vitamins"
        HEART = "HEART", "Heart Medications"
        OTHER = "OTHER", "Other"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="medicines",
    )
    name = models.CharField(max_length=255)
    disease_category = models.CharField(
        max_length=30,
        choices=DiseaseCategory.choices,
        default=DiseaseCategory.OTHER,
    )
    stock_quantity = models.PositiveIntegerField(default=0)
    unit = models.CharField(max_length=50, default="tablet")
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Dosage(models.Model):
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name="dosages",
    )
    quantity_per_dose = models.PositiveIntegerField(default=1)
    frequency_per_day = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.medicine.name} - {self.quantity_per_dose} per dose"


class MedicationSchedule(models.Model):
    class TimeOfDay(models.TextChoices):
        MORNING = "MORNING", "Morning"
        AFTERNOON = "AFTERNOON", "Afternoon"
        NIGHT = "NIGHT", "Night"

    dosage = models.ForeignKey(
        Dosage,
        on_delete=models.CASCADE,
        related_name="schedules",
    )
    time_of_day = models.CharField(
        max_length=20,
        choices=TimeOfDay.choices,
    )
    scheduled_time = models.TimeField()
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"{self.dosage.medicine.name} - "
            f"{self.time_of_day} - "
            f"{self.scheduled_time}"
        )