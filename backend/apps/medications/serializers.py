from rest_framework import serializers

from .models import MedicationSchedule, Medicine


class MedicationScheduleSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source="medicine.name", read_only=True)

    class Meta:
        model = MedicationSchedule
        fields = "__all__"


class MedicineSerializer(serializers.ModelSerializer):
    schedules = MedicationScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = Medicine
        fields = "__all__"
