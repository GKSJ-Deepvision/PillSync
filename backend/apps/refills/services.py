from datetime import timedelta
from math import ceil

from django.core.exceptions import ValidationError
from django.db.models import Count
from django.utils import timezone

from apps.medicines.models import Medicine

from .models import RefillPrediction


class RefillPredictionService:
    """Production boundary for refill prediction implementations."""

    def predict(self, medicine: Medicine) -> RefillPrediction:
        daily_consumption = medicine.schedules.filter(is_active=True).aggregate(count=Count("id"))[
            "count"
        ]
        if daily_consumption == 0:
            raise ValidationError(
                {"medicine": "At least one active medication schedule is required."}
            )

        days_remaining = max(
            0,
            ceil((medicine.quantity - medicine.refill_threshold) / daily_consumption),
        )
        prediction = RefillPrediction.objects.update_or_create(
            medicine=medicine,
            defaults={
                "daily_consumption": daily_consumption,
                "days_remaining": days_remaining,
                "predicted_refill_date": timezone.localdate() + timedelta(days=days_remaining),
                "is_fallback": True,
            },
        )[0]
        return prediction
