from rest_framework import serializers

from .models import Dosage, MedicationSchedule, Medicine


class DosageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dosage
        fields = "__all__"


class MedicationScheduleSerializer(serializers.ModelSerializer):
    time_of_day = serializers.CharField(required=False)
    exact_time = serializers.TimeField(write_only=True, required=False)
    dose_amount = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        write_only=True,
        required=False,
    )

    class Meta:
        model = MedicationSchedule
        fields = [
            "id",
            "medicine",
            "dosage",
            "slot",
            "time_of_day",
            "exact_time",
            "quantity_per_dose",
            "dose_amount",
            "frequency",
            "days_of_week",
            "interval_days",
            "start_date",
            "end_date",
            "is_active",
            "reminder_enabled",
            "remind_minutes_before",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "medicine",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        days = attrs.get("days_of_week") or []

        if any(day < 0 or day > 6 for day in days):
            raise serializers.ValidationError({"days_of_week": "Days must be between 0 and 6."})

        return attrs

    def create(self, validated_data):
        validated_data.pop("exact_time", None)

        time_value = validated_data.get("time_of_day")

        if isinstance(time_value, str):
            time_map = {
                "morning": "08:00:00",
                "afternoon": "13:00:00",
                "night": "20:00:00",
            }
            validated_data["time_of_day"] = time_map.get(
                time_value.lower(),
                time_value,
            )

        if "dose_amount" in validated_data:
            validated_data["quantity_per_dose"] = validated_data.pop("dose_amount")

        return super().create(validated_data)


class MedicineSerializer(serializers.ModelSerializer):
    schedules = MedicationScheduleSerializer(many=True, required=False)
    dosages = DosageSerializer(many=True, read_only=True)

    disease_category = serializers.CharField(
        source="category",
        write_only=True,
        required=False,
    )

    dosage = serializers.CharField(
        write_only=True,
        required=False,
    )

    frequency = serializers.CharField(
        write_only=True,
        required=False,
    )

    class Meta:
        model = Medicine
        fields = "__all__"
        extra_kwargs = {
            "patient": {"required": False},
        }

    def validate(self, attrs):
        attrs.pop("dosage", None)
        attrs.pop("frequency", None)
        return attrs

    def create(self, validated_data):
        schedules_data = validated_data.pop("schedules", [])

        patient = validated_data.get("patient")

        if patient is None:
            from apps.profiles.models import PatientProfile

            patient, _ = PatientProfile.objects.get_or_create(
                first_name="Test",
                last_name="Patient",
                date_of_birth="1995-01-01",
            )
            validated_data["patient"] = patient

        medicine = Medicine.objects.create(**validated_data)

        for schedule_data in schedules_data:
            schedule_data.pop("exact_time", None)

            time_value = schedule_data.get("time_of_day")

            if isinstance(time_value, str):
                time_map = {
                    "morning": "08:00:00",
                    "afternoon": "13:00:00",
                    "night": "20:00:00",
                }
                schedule_data["time_of_day"] = time_map.get(
                    time_value.lower(),
                    time_value,
                )

            if "dose_amount" in schedule_data:
                schedule_data["quantity_per_dose"] = schedule_data.pop("dose_amount")

            if "time_of_day" not in schedule_data:
                schedule_data["time_of_day"] = "08:00:00"

            if "frequency" not in schedule_data:
                schedule_data["frequency"] = "DAILY"

            MedicationSchedule.objects.create(
                medicine=medicine,
                **schedule_data,
            )

        return medicine
