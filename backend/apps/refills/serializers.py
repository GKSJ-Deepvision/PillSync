from rest_framework import serializers

from .models import RefillPrediction, RefillRequest


class RefillPredictionSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source="medicine.name", read_only=True)

    class Meta:
        model = RefillPrediction
        fields = "__all__"


class RefillRequestSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source="medicine.name", read_only=True)

    class Meta:
        model = RefillRequest
        fields = "__all__"
