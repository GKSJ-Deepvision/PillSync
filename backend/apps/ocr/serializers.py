from rest_framework import serializers
from .models import PrescriptionUpload
from backend.apps.medications.models import Medication


class ExtractedMedicineSerializer(serializers.Serializer):
    """
    Serializes an individual structured medication extracted from OCR.
    """
    medicine_name = serializers.CharField(max_length=255, required=True)
    dosage = serializers.CharField(max_length=100, required=False, allow_null=True, allow_blank=True)
    quantity = serializers.CharField(max_length=100, required=False, allow_null=True, allow_blank=True)
    frequency = serializers.CharField(max_length=100, required=False, allow_null=True, allow_blank=True)
    duration = serializers.CharField(max_length=100, required=False, allow_null=True, allow_blank=True)
    prescription_details = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    confidence = serializers.CharField(max_length=20, required=False, default='Medium')


class PrescriptionUploadResponseSerializer(serializers.Serializer):
    """
    Structured API response returned to client after prescription OCR processing.
    """
    success = serializers.BooleanField(default=True)
    upload_id = serializers.IntegerField(required=False, allow_null=True)
    raw_text = serializers.CharField(allow_blank=True)
    mean_confidence = serializers.FloatField(default=0.0)
    confidence_level = serializers.CharField(default='Medium')
    medicines = ExtractedMedicineSerializer(many=True)
    message = serializers.CharField()


class MedicationBatchSaveSerializer(serializers.Serializer):
    """
    Accepts reviewed/edited medicines from user and validates them for persistence.
    """
    medicines = ExtractedMedicineSerializer(many=True)

    def create(self, validated_data):
        user = self.context.get('user')
        if user and not user.is_authenticated:
            user = None

        created_meds = []
        for item in validated_data['medicines']:
            med = Medication.objects.create(
                user=user,
                medicine_name=item['medicine_name'],
                dosage=item.get('dosage'),
                quantity=item.get('quantity'),
                frequency=item.get('frequency'),
                duration=item.get('duration'),
                prescription_details=item.get('prescription_details'),
                confidence=item.get('confidence', 'High'),
                source='OCR'
            )
            created_meds.append(med)
        return created_meds
