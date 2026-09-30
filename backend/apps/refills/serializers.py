"""Refill API shapes."""

from __future__ import annotations

from rest_framework import serializers

from .models import RefillPrediction, StockEvent


class RefillPredictionSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source="medicine.display_name", read_only=True)
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    quantity_per_refill = serializers.DecimalField(
        source="medicine.quantity_per_refill", max_digits=8, decimal_places=2, read_only=True
    )
    message = serializers.SerializerMethodField()

    class Meta:
        model = RefillPrediction
        fields = (
            "id",
            "medicine",
            "medicine_name",
            "patient",
            "patient_name",
            "status",
            "status_display",
            "message",
            "computed_at",
            "remaining_stock",
            "quantity_per_refill",
            "scheduled_daily",
            "observed_daily",
            "average_daily",
            "observed_weight",
            "sample_days",
            "resolved_doses",
            "days_remaining",
            "depletion_date",
            "recommended_refill_date",
            "covers_course",
            "confidence",
        )
        read_only_fields = fields

    def get_message(self, obj: RefillPrediction) -> str:
        from .services.prediction import message_for

        return message_for(obj.medicine, obj)


class StockEventSerializer(serializers.ModelSerializer):
    kind_display = serializers.CharField(source="get_kind_display", read_only=True)
    actor_name = serializers.CharField(source="actor.full_name", read_only=True, default="")

    class Meta:
        model = StockEvent
        fields = (
            "id",
            "medicine",
            "kind",
            "kind_display",
            "quantity_delta",
            "quantity_after",
            "reason",
            "actor_name",
            "created_at",
        )
        read_only_fields = fields


class AdjustStockSerializer(serializers.Serializer):
    quantity = serializers.DecimalField(max_digits=8, decimal_places=2, min_value=0)
    reason = serializers.CharField(max_length=255, required=False, allow_blank=True)
