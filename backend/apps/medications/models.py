from django.conf import settings
from django.db import models


class DiseaseCategory(models.TextChoices):
    BLOOD_PRESSURE = "BLOOD_PRESSURE", "Blood Pressure"
    DIABETES = "DIABETES", "Diabetes"
    THYROID = "THYROID", "Thyroid"
    ANTIBIOTICS = "ANTIBIOTICS", "Antibiotics"
    VITAMINS = "VITAMINS", "Vitamins"
    HEART = "HEART", "Heart Medications"


class Medicine(models.Model):
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="medicines",
    )
    medicine_name = models.CharField(max_length=150)
    generic_name = models.CharField(max_length=150, blank=True)
    dosage = models.DecimalField(max_digits=10, decimal_places=2)
    dosage_form = models.CharField(max_length=50)
    quantity = models.PositiveIntegerField(default=0)
    disease_category = models.CharField(
        max_length=30,
        choices=DiseaseCategory.choices,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.medicine_name


class Dosage(models.Model):
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name="dosages",
    )
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=30)

    def __str__(self):
        return f"{self.medicine.medicine_name} - {self.quantity} {self.unit}"


class MedicationSchedule(models.Model):
    class TimeOfDay(models.TextChoices):
        MORNING = "MORNING", "Morning"
        AFTERNOON = "AFTERNOON", "Afternoon"
        NIGHT = "NIGHT", "Night"

    class RepeatRule(models.TextChoices):
        DAILY = "DAILY", "Daily"
        WEEKLY = "WEEKLY", "Weekly"
        CUSTOM = "CUSTOM", "Custom"

    dosage = models.ForeignKey(
        Dosage,
        on_delete=models.CASCADE,
        related_name="schedules",
    )
    scheduled_time = models.TimeField()
    time_of_day = models.CharField(
        max_length=20,
        choices=TimeOfDay.choices,
    )
    frequency = models.CharField(max_length=100)
    repeat_rule = models.CharField(
        max_length=20,
        choices=RepeatRule.choices,
        default=RepeatRule.DAILY,
    )
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return (
            f"{self.dosage.medicine.medicine_name} - " f"{self.time_of_day} - {self.scheduled_time}"
        )
