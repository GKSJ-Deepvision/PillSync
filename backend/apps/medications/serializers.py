from rest_framework import serializers

from apps.medications.models import Dosage, MedicationSchedule, Medicine


class MedicationScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationSchedule
        fields = (
            "id",
            "dosage",
            "scheduled_time",
            "time_of_day",
            "frequency",
            "repeat_rule",
            "start_date",
            "end_date",
        )


class DosageSerializer(serializers.ModelSerializer):
    schedules = MedicationScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = Dosage
        fields = ("id", "medicine", "quantity", "unit", "schedules")


class MedicineSerializer(serializers.ModelSerializer):
    dosages = DosageSerializer(many=True, read_only=True)

    class Meta:
        model = Medicine
        fields = (
            "id",
            "patient",
            "medicine_name",
            "generic_name",
            "dosage",
            "dosage_form",
            "quantity",
            "disease_category",
            "is_active",
            "created_at",
            "dosages",
        )
        read_only_fields = ("id", "patient", "created_at")

    def validate_dosage(self, value):
        if value <= 0:
            raise serializers.ValidationError("Dosage must be greater than zero.")
        return value
