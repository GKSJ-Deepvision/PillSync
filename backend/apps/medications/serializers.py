from datetime import time
from rest_framework import serializers
from .models import Medication, MedicationSchedule, MedicationHistory

WINDOW_TIME_MAPPING = {
    "morning": time(8, 0),
    "afternoon": time(13, 0),
    "evening": time(18, 0),
    "night": time(21, 0),
}


class MedicationScheduleSerializer(serializers.ModelSerializer):
    medication = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = MedicationSchedule
        fields = [
            "id",
            "medication",
            "time_of_day",
            "exact_time",
            "days_of_week",
            "dose_amount",
            "is_active",
        ]
        read_only_fields = ["id", "medication"]
        extra_kwargs = {
            "exact_time": {"required": False},
            "dose_amount": {"required": False},
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["window"] = instance.window
        data["scheduled_time"] = str(instance.exact_time)
        return data

    def validate_days_of_week(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("days_of_week must be a list.")
        for item in value:
            if isinstance(item, int):
                if item < 0 or item > 6:
                    raise serializers.ValidationError("Weekday integer index must be between 0 (Mon) and 6 (Sun).")
            elif isinstance(item, str):
                if item.lower()[:3] not in ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]:
                    raise serializers.ValidationError(f"Invalid weekday name '{item}'.")
            else:
                raise serializers.ValidationError("Weekday entries must be integers 0-6 or string names.")
        return value

    def validate(self, attrs):
        if "time_of_day" not in attrs and "window" in self.initial_data:
            attrs["time_of_day"] = str(self.initial_data["window"]).lower()
        if "exact_time" not in attrs and "scheduled_time" in self.initial_data:
            attrs["exact_time"] = self.initial_data["scheduled_time"]
        if "exact_time" not in attrs:
            time_of_day = attrs.get("time_of_day", "morning")
            attrs["exact_time"] = WINDOW_TIME_MAPPING.get(time_of_day.lower(), time(8, 0))
        return attrs


DosageScheduleSerializer = MedicationScheduleSerializer


class MedicationSerializer(serializers.ModelSerializer):
    startDate = serializers.DateField(source="start_date", required=False)
    endDate = serializers.DateField(source="end_date", required=False, allow_null=True)
    quantity = serializers.IntegerField(source="quantity_remaining", required=False)
    disease = serializers.CharField(required=False, allow_blank=True)
    schedules = MedicationScheduleSerializer(many=True, required=False)
    schedule = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = Medication
        fields = [
            "id",
            "name",
            "disease_category",
            "disease",
            "dosage",
            "quantity",
            "quantity_remaining",
            "refill_threshold",
            "frequency",
            "instructions",
            "start_date",
            "end_date",
            "startDate",
            "endDate",
            "is_active",
            "status",
            "schedule",
            "schedules",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "start_date": {"required": False},
            "end_date": {"required": False, "allow_null": True},
            "frequency": {"required": False, "default": "Once daily"},
            "instructions": {"required": False, "allow_blank": True},
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["schedule"] = [s.time_of_day.capitalize() for s in instance.schedules.all()]
        data["disease"] = instance.disease
        data["startDate"] = str(instance.start_date) if instance.start_date else None
        data["endDate"] = str(instance.end_date) if instance.end_date else None
        data["status"] = "active" if instance.is_active else "completed"
        return data

    def validate(self, attrs):
        # Resolve start_date
        if "start_date" not in attrs and "startDate" in self.initial_data:
            attrs["start_date"] = self.initial_data["startDate"]
        if "start_date" not in attrs:
            from django.utils import timezone

            attrs["start_date"] = timezone.now().date()

        # Map human disease string to disease_category choice if provided
        disease_input = self.initial_data.get("disease") or attrs.get("disease")
        if disease_input and "disease_category" not in attrs:
            cleaned = str(disease_input).lower().replace(" ", "_")
            valid_choices = [c[0] for c in Medication.Category.choices]
            if cleaned in valid_choices:
                attrs["disease_category"] = cleaned
            elif "diabetes" in cleaned:
                attrs["disease_category"] = Medication.Category.DIABETES
            elif "pressure" in cleaned or "hypertension" in cleaned:
                attrs["disease_category"] = Medication.Category.BLOOD_PRESSURE
            elif "heart" in cleaned or "cardiac" in cleaned:
                attrs["disease_category"] = Medication.Category.HEART
            elif "thyroid" in cleaned:
                attrs["disease_category"] = Medication.Category.THYROID
            elif "vitamin" in cleaned:
                attrs["disease_category"] = Medication.Category.VITAMINS
            elif "antibiotic" in cleaned:
                attrs["disease_category"] = Medication.Category.ANTIBIOTICS
            else:
                attrs["disease_category"] = Medication.Category.OTHER

        attrs.pop("disease", None)
        return attrs

    def create(self, validated_data):
        schedule_strings = validated_data.pop("schedule", None)
        schedules_data = validated_data.pop("schedules", None)
        request = self.context.get("request")
        user = validated_data.pop("owner", None)
        if not user and request and request.user.is_authenticated:
            user = request.user

        medication = Medication.objects.create(owner=user, **validated_data)

        if schedules_data:
            for s_data in schedules_data:
                time_of_day = s_data.get("time_of_day", "morning")
                exact_time = s_data.get("exact_time") or WINDOW_TIME_MAPPING.get(time_of_day, time(8, 0))
                days_of_week = s_data.get("days_of_week", [0, 1, 2, 3, 4, 5, 6])
                dose_amount = s_data.get("dose_amount", 1.00)
                MedicationSchedule.objects.create(
                    medication=medication,
                    time_of_day=time_of_day,
                    exact_time=exact_time,
                    days_of_week=days_of_week,
                    dose_amount=dose_amount,
                )
        elif schedule_strings:
            for s_name in schedule_strings:
                clean_name = str(s_name).strip().lower()
                exact_t = WINDOW_TIME_MAPPING.get(clean_name, time(8, 0))
                tod = clean_name if clean_name in WINDOW_TIME_MAPPING else "morning"
                MedicationSchedule.objects.create(
                    medication=medication,
                    time_of_day=tod,
                    exact_time=exact_t,
                    days_of_week=[0, 1, 2, 3, 4, 5, 6],
                )
        else:
            MedicationSchedule.objects.create(
                medication=medication,
                time_of_day="morning",
                exact_time=time(8, 0),
                days_of_week=[0, 1, 2, 3, 4, 5, 6],
            )

        return medication

    def update(self, instance, validated_data):
        schedule_strings = validated_data.pop("schedule", None)
        schedules_data = validated_data.pop("schedules", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if schedules_data is not None:
            instance.schedules.all().delete()
            for s_data in schedules_data:
                time_of_day = s_data.get("time_of_day", "morning")
                exact_time = s_data.get("exact_time") or WINDOW_TIME_MAPPING.get(time_of_day, time(8, 0))
                days_of_week = s_data.get("days_of_week", [0, 1, 2, 3, 4, 5, 6])
                dose_amount = s_data.get("dose_amount", 1.00)
                MedicationSchedule.objects.create(
                    medication=instance,
                    time_of_day=time_of_day,
                    exact_time=exact_time,
                    days_of_week=days_of_week,
                    dose_amount=dose_amount,
                )
        elif schedule_strings is not None:
            instance.schedules.all().delete()
            for s_name in schedule_strings:
                clean_name = str(s_name).strip().lower()
                exact_t = WINDOW_TIME_MAPPING.get(clean_name, time(8, 0))
                tod = clean_name if clean_name in WINDOW_TIME_MAPPING else "morning"
                MedicationSchedule.objects.create(
                    medication=instance,
                    time_of_day=tod,
                    exact_time=exact_t,
                    days_of_week=[0, 1, 2, 3, 4, 5, 6],
                )

        return instance


class TodayDoseSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="schedule_id")
    schedule_id = serializers.IntegerField()
    medication_id = serializers.IntegerField()
    medicationName = serializers.CharField(source="medication_name")
    medication_name = serializers.CharField()
    dosage = serializers.CharField()
    disease = serializers.CharField()
    scheduled_time = serializers.CharField()
    time = serializers.CharField(source="scheduled_time")
    window = serializers.CharField()
    schedule = serializers.CharField(source="window")
    status = serializers.CharField()
    instructions = serializers.CharField(allow_blank=True, default="")
    date = serializers.CharField()
    taken_datetime = serializers.DateTimeField(allow_null=True, required=False)


class MedicationHistorySerializer(serializers.ModelSerializer):
    medication_name = serializers.CharField(source="medication.name", read_only=True)
    dosage = serializers.CharField(source="medication.dosage", read_only=True)
    disease = serializers.CharField(source="medication.disease", read_only=True)
    schedule_window = serializers.CharField(source="dosage_schedule.window", read_only=True, default="General")

    class Meta:
        model = MedicationHistory
        fields = [
            "id",
            "medication",
            "medication_name",
            "dosage",
            "disease",
            "dosage_schedule",
            "schedule_window",
            "scheduled_datetime",
            "status",
            "taken_datetime",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
