from rest_framework import serializers

from .models import PrescriptionScan


class PrescriptionScanSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescriptionScan
        fields = [
            "id",
            "patient_id",
            "image",
            "source",
            "result",
            "raw_text",
            "medicine_name",
            "dosage",
            "quantity",
            "frequency",
            "created_at",
        ]
        read_only_fields = fields
