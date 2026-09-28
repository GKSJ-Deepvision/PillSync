from django.db import models

from apps.medicines.models import Medicine


class RefillPrediction(models.Model):
    medicine = models.OneToOneField(
        Medicine,
        on_delete=models.CASCADE,
        related_name="refill_prediction",
    )
    daily_consumption = models.PositiveIntegerField()
    days_remaining = models.PositiveIntegerField()
    predicted_refill_date = models.DateField()
    is_fallback = models.BooleanField(default=True)
    generated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.medicine.name} refill prediction"
