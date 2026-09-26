from django.db import models

from apps.medications.models import Medicine
from apps.profiles.models import PatientProfile


class RefillPrediction(models.Model):
    patient_profile = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name="refill_predictions",
        null=True,
        blank=True,
    )
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name="refill_predictions",
    )
    current_stock = models.PositiveIntegerField(default=30)
    daily_consumption = models.FloatField(default=2.0)
    days_remaining = models.IntegerField(default=15)
    estimated_depletion_date = models.DateField()
    recommended_refill_date = models.DateField()
    is_low_stock = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"RefillPrediction: {self.medicine.name} ({self.days_remaining} days left)"


class RefillRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "Pending", "Pending"
        APPROVED = "Approved", "Approved"
        FULFILLED = "Fulfilled", "Fulfilled"

    patient_profile = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name="refill_requests",
        null=True,
        blank=True,
    )
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name="refill_requests")
    requested_quantity = models.PositiveIntegerField(default=30)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"RefillRequest: {self.medicine.name} - {self.status}"
