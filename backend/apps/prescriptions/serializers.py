"""Serializers for prescriptions."""

from __future__ import annotations

from rest_framework import serializers

from apps.profiles.models import PatientProfile

from .models import Prescription


class PrescriptionSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    days_until_expiry = serializers.SerializerMethodField()
    medicine_count = serializers.SerializerMethodField()

    class Meta:
        model = Prescription
        fields = (
            "id",
            "patient",
            "patient_name",
            "doctor_name",
            "clinic_name",
            "reference_number",
            "issued_on",
            "expires_on",
            "days_until_expiry",
            "is_expired",
            "image",
            "notes",
            "status",
            "status_display",
            "ocr_extracted",
            "ocr_confidence",
            "medicine_count",
            "created_at",
        )
        read_only_fields = (
            "id",
            "created_at",
            # Written by the OCR pipeline in Milestone 3, never by a client.
            "ocr_extracted",
            "ocr_confidence",
        )

    def get_days_until_expiry(self, obj: Prescription) -> int | None:
        return obj.days_until_expiry()

    def get_medicine_count(self, obj: Prescription) -> int:
        return obj.medicines.count()

    def validate_patient(self, value: PatientProfile) -> PatientProfile:
        request = self.context["request"]
        if not request.user.is_admin and value.managed_by_id != request.user.id:
            raise serializers.ValidationError("You do not manage that patient profile.")
        return value

    def validate(self, attrs: dict) -> dict:
        issued = attrs.get("issued_on", getattr(self.instance, "issued_on", None))
        expires = attrs.get("expires_on", getattr(self.instance, "expires_on", None))
        if issued and expires and expires < issued:
            raise serializers.ValidationError(
                {"expires_on": "A prescription cannot expire before it was issued."}
            )
        return attrs
