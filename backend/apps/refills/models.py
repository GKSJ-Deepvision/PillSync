from django.db import models

from apps.medications.models import Medication


class RefillLog(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending Order"),
        ("approved", "Approved by Pharmacy"),
        ("dispatched", "Dispatched"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    )

    medication = models.ForeignKey(Medication, on_delete=models.CASCADE, related_name="refill_logs")
    quantity_requested = models.IntegerField(default=60)
    requested_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Refill for {self.medication.name} - {self.status}"
