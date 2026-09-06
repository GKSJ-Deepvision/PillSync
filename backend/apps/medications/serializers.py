from rest_framework import serializers

from .models import Dosage, MedicationSchedule, Medicine


class DosageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dosage
        fields = "__all__"


class MedicationScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationSchedule
        fields = "__all__"


class MedicineSerializer(serializers.ModelSerializer):
    dosages = DosageSerializer(many=True, read_only=True)
    schedules = MedicationScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = Medicine
        fields = "__all__"
