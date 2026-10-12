from django.db import models

from apps.medications.models import Medicine
from apps.profiles.models import PatientProfile


class RefillStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    FULFILLED = "FULFILLED", "Fulfilled"
    CANCELLED = "CANCELLED", "Cancelled"


class RefillRequest(models.Model):
    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name="refill_requests",
    )
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name="refill_requests",
    )
    quantity = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=RefillStatus.choices,
        default=RefillStatus.PENDING,
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    fulfilled_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-requested_at"]

    def __str__(self):
        return f"Refill for {self.medicine.name} ({self.status})"
