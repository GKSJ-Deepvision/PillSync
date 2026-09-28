from rest_framework import serializers

from .models import RefillPrediction


class RefillPredictionSerializer(serializers.ModelSerializer):
    medicine = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = RefillPrediction
        fields = [
            "id",
            "medicine",
            "daily_consumption",
            "days_remaining",
            "predicted_refill_date",
            "is_fallback",
            "generated_at",
        ]
        read_only_fields = fields
