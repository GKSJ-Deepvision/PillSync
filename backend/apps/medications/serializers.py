from rest_framework import serializers

from .models import Medication, MedicationSchedule


class MedicationScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationSchedule
        fields = [
            "id",
            "time_of_day",
            "exact_time",
            "days_of_week",
            "dose_amount",
            "is_active",
        ]

    def validate_days_of_week(self, value):
        if not isinstance(value, list) or not value:
            raise serializers.ValidationError(
                "days_of_week must be a non-empty list of weekday numbers."
            )
        if any(not isinstance(day, int) or day < 0 or day > 6 for day in value):
            raise serializers.ValidationError(
                "Weekdays must be integers from 0 (Monday) to 6 (Sunday)."
            )
        return sorted(set(value))


class MedicationSerializer(serializers.ModelSerializer):
    schedules = MedicationScheduleSerializer(many=True, required=False)

    class Meta:
        model = Medication
        fields = [
            "id",
            "name",
            "disease_category",
            "dosage",
            "frequency",
            "instructions",
            "quantity_remaining",
            "refill_threshold",
            "is_active",
            "start_date",
            "end_date",
            "schedules",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if end_date and start_date and end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date."})
        return attrs

    def create(self, validated_data):
        schedules = validated_data.pop("schedules", [])
        medication = Medication.objects.create(**validated_data)
        MedicationSchedule.objects.bulk_create(
            [MedicationSchedule(medication=medication, **schedule) for schedule in schedules]
        )
        return medication

    def update(self, instance, validated_data):
        schedules = validated_data.pop("schedules", None)
        instance = super().update(instance, validated_data)
        if schedules is not None:
            instance.schedules.all().delete()
            MedicationSchedule.objects.bulk_create(
                [MedicationSchedule(medication=instance, **schedule) for schedule in schedules]
            )
        return instance
