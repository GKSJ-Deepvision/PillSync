from rest_framework import serializers

from .models import RefillRequest


class RefillRequestSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source="medicine.name", read_only=True)

    class Meta:
        model = RefillRequest
        fields = [
            "id",
            "patient",
            "medicine",
            "medicine_name",
            "quantity",
            "status",
            "requested_at",
            "fulfilled_at",
            "notes",
        ]
        read_only_fields = ["id", "requested_at", "fulfilled_at"]
