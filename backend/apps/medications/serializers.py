from rest_framework import serializers

from .models import Dosage, MedicationSchedule


class DosageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dosage
        fields = [
            "id",
            "medicine",
            "amount",
            "instructions",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class MedicationScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationSchedule
        fields = [
            "id",
            "dosage",
            "time",
            "frequency",
            "day_of_week",
            "start_date",
            "end_date",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        frequency = attrs.get(
            "frequency",
            getattr(self.instance, "frequency", None),
        )
        day_of_week = attrs.get(
            "day_of_week",
            getattr(self.instance, "day_of_week", None),
        )
        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None),
        )
        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None),
        )

        if frequency == MedicationSchedule.Frequency.WEEKLY and day_of_week is None:
            raise serializers.ValidationError(
                {"day_of_week": "This field is required for weekly schedules."}
            )

        if frequency == MedicationSchedule.Frequency.DAILY and day_of_week is not None:
            raise serializers.ValidationError(
                {"day_of_week": "This field must be empty for daily schedules."}
            )

        if end_date is not None and start_date is not None and end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date."})

        return attrs
