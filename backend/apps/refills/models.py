from django.db import models

from apps.medications.models import Medicine


class RefillPrediction(models.Model):
    medicine = models.ForeignKey(
        Medicine,
        on_delete=models.CASCADE,
        related_name="refill_predictions",
    )

    remaining_stock = models.PositiveIntegerField(default=0)
    average_daily_consumption = models.FloatField(default=0)
    estimated_depletion_date = models.DateField(
        null=True,
        blank=True,
    )
    recommended_refill_date = models.DateField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Refill prediction - {self.medicine.name}"