from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Medication


class MedicationSerializer(serializers.ModelSerializer):
    patient_id = serializers.PrimaryKeyRelatedField(
        source="patient",
        queryset=User.objects.all(),
        allow_null=True,
        required=False,
    )
    caregiver_id = serializers.PrimaryKeyRelatedField(
        source="caregiver",
        queryset=User.objects.all(),
        allow_null=True,
        required=False,
    )
    patient_name = serializers.SerializerMethodField()
    caregiver_name = serializers.SerializerMethodField()

    class Meta:
        model = Medication
        fields = [
            "id",
            "name",
            "dosage",
            "stock",
            "total_stock",
            "frequency",
            "disease_category",
            "times_of_day",
            "food_timing",
            "start_date",
            "end_date",
            "timing_details",
            "stock_days",
            "refill_threshold",
            "fda_ndc",
            "manufacturer",
            "active_ingredient",
            "created_at",
            # Legacy fields
            "assigned_patient_id",
            "assigned_patient_name",
            # FK-based fields
            "patient_id",
            "patient_name",
            "caregiver_id",
            "caregiver_name",
        ]

    def get_patient_name(self, obj):
        if obj.patient:
            name = obj.patient.get_full_name()
            return name if name.strip() else obj.patient.username
        return obj.assigned_patient_name or None

    def get_caregiver_name(self, obj):
        if obj.caregiver:
            name = obj.caregiver.get_full_name()
            return name if name.strip() else obj.caregiver.username
        return None
