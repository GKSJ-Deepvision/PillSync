from rest_framework import serializers

from .models import Prescription


class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = [
            "id",
            "patient",
            "doctor_name",
            "clinic_name",
            "diagnosis",
            "issue_date",
            "expiration_date",
            "document_url",
            "notes",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
