from rest_framework import serializers

from apps.refills.models import RefillLog


class StockUpdateSerializer(serializers.Serializer):
    medication_id = serializers.IntegerField()
    new_stock = serializers.IntegerField(min_value=0)


class RequestRefillSerializer(serializers.Serializer):
    medication_id = serializers.IntegerField()
    quantity = serializers.IntegerField(default=60, min_value=1)
    notes = serializers.CharField(required=False, allow_blank=True)


class RefillLogSerializer(serializers.ModelSerializer):
    medication_name = serializers.CharField(source="medication.name", read_only=True)

    class Meta:
        model = RefillLog
        fields = [
            "id",
            "medication",
            "medication_name",
            "quantity_requested",
            "requested_at",
            "status",
            "notes",
        ]
