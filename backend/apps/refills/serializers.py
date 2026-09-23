from rest_framework import serializers

from .models import RefillCheck


class RefillCheckRequestSerializer(serializers.Serializer):
    medication_id = serializers.UUIDField()
    medicine_name = serializers.CharField(max_length=255, required=False, default="")
    quantity_on_hand = serializers.FloatField(min_value=0)
    daily_consumption = serializers.FloatField(min_value=0)
    lead_time_days = serializers.IntegerField(required=False, default=5, min_value=0)
    low_stock_threshold_days = serializers.IntegerField(required=False, default=5, min_value=0)


class RefillCheckSerializer(serializers.ModelSerializer):
    class Meta:
        model = RefillCheck
        fields = [
            "id",
            "medication_id",
            "patient_id",
            "quantity_on_hand",
            "daily_consumption",
            "days_remaining",
            "depletion_date",
            "recommended_refill_date",
            "is_low_stock",
            "checked_at",
        ]
        read_only_fields = fields
