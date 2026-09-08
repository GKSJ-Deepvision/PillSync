from django.db import models

from apps.profiles.models import PatientProfile


class Medicine(models.Model):
    class Category(models.TextChoices):
        BLOOD_PRESSURE = "Blood Pressure", "Blood Pressure"
        DIABETES = "Diabetes", "Diabetes"
        THYROID = "Thyroid", "Thyroid"
        ANTIBIOTICS = "Antibiotics", "Antibiotics"
        VITAMINS = "Vitamins", "Vitamins"
        HEART = "Heart Medications", "Heart Medications"
        OTHER = "Other", "Other"

    patient_profile = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name="medicines",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50, choices=Category.choices, default=Category.OTHER)
    dosage = models.CharField(max_length=50, default="1 Tablet")
    stock_quantity = models.PositiveIntegerField(default=30)
    unit = models.CharField(max_length=20, default="tablets")
    start_date = models.DateField(auto_now_add=True)
    end_date = models.DateField(null=True, blank=True)
    instructions = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.category})"


class MedicationSchedule(models.Model):
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name="schedules")
    patient_profile = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name="schedules",
        null=True,
        blank=True,
    )
    time_slot = models.CharField(max_length=50, default="Morning")
    scheduled_time = models.TimeField()
    dosage_amount = models.CharField(max_length=50, default="1 Tablet")
    frequency = models.CharField(max_length=50, default="1 / day")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.medicine.name} at {self.scheduled_time} ({self.time_slot})"
