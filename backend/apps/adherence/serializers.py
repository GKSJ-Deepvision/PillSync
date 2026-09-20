from django.utils import timezone
from rest_framework import serializers

from apps.adherence.models import DoseEvent, DoseEventStatus
from apps.medications.models import MedicationSchedule


class DoseEventSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(
        source="schedule.dosage.medicine.medicine_name",
        read_only=True,
    )
    scheduled_time = serializers.TimeField(
        source="schedule.scheduled_time",
        read_only=True,
    )
    time_of_day = serializers.CharField(
        source="schedule.time_of_day",
        read_only=True,
    )

    class Meta:
        model = DoseEvent
        fields = (
            "id",
            "schedule",
            "medicine_name",
            "scheduled_time",
            "time_of_day",
            "dose_date",
            "status",
            "taken_at",
            "snoozed_at",
            "snoozed_until",
            "missed_at",
            "note",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "taken_at",
            "snoozed_at",
            "missed_at",
            "created_at",
            "updated_at",
        )


class DoseEventWriteSerializer(serializers.Serializer):
    schedule = serializers.PrimaryKeyRelatedField(queryset=MedicationSchedule.objects.all())
    dose_date = serializers.DateField()
    status = serializers.ChoiceField(choices=DoseEventStatus.choices)
    note = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
    )
    snoozed_until = serializers.DateTimeField(
        required=False,
        allow_null=True,
    )

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user
        schedule = attrs["schedule"]
        status = attrs["status"]

        if schedule.dosage.medicine.patient_id != user.id:
            raise serializers.ValidationError(
                {"schedule": ("You do not have permission to log a dose " "for this medication.")}
            )

        if not schedule.dosage.medicine.is_active:
            raise serializers.ValidationError({"schedule": "This medication is inactive."})

        if status == DoseEventStatus.SNOOZED:
            snoozed_until = attrs.get("snoozed_until")

            if not snoozed_until:
                raise serializers.ValidationError(
                    {"snoozed_until": ("Snoozed doses require a snoozed-until time.")}
                )

            if snoozed_until <= timezone.now():
                raise serializers.ValidationError(
                    {"snoozed_until": ("The snoozed-until time must be in the future.")}
                )

        elif attrs.get("snoozed_until"):
            raise serializers.ValidationError(
                {"snoozed_until": ("Only snoozed doses can have a snoozed-until time.")}
            )

        return attrs


class TodayDoseSerializer(serializers.Serializer):
    schedule_id = serializers.IntegerField()
    medicine_id = serializers.IntegerField()
    medicine_name = serializers.CharField()
    scheduled_time = serializers.TimeField()
    time_of_day = serializers.CharField()
    dose_date = serializers.DateField()
    status = serializers.CharField()
    event_id = serializers.IntegerField(allow_null=True)
    taken_at = serializers.DateTimeField(allow_null=True)
    snoozed_until = serializers.DateTimeField(allow_null=True)
    note = serializers.CharField()
