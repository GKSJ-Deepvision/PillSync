from django.utils import timezone
from rest_framework import serializers

from .models import DoseEvent


class DoseEventSerializer(serializers.ModelSerializer):
    medication_name = serializers.CharField(source="medication.name", read_only=True)
    schedule_time = serializers.TimeField(source="schedule.exact_time", read_only=True)

    class Meta:
        model = DoseEvent
        fields = [
            "id",
            "medication",
            "medication_name",
            "schedule",
            "schedule_time",
            "scheduled_for",
            "status",
            "recorded_at",
            "acted_at",
            "snoozed_until",
            "notes",
        ]
        read_only_fields = ["id", "recorded_at", "acted_at", "medication_name", "schedule_time"]

    def validate(self, attrs):
        medication = attrs.get("medication", getattr(self.instance, "medication", None))
        schedule = attrs.get("schedule", getattr(self.instance, "schedule", None))
        if schedule and medication and schedule.medication_id != medication.id:
            raise serializers.ValidationError(
                {"schedule": "Schedule must belong to the selected medication."}
            )
        status = attrs.get("status", getattr(self.instance, "status", None))
        snoozed_until = attrs.get("snoozed_until", getattr(self.instance, "snoozed_until", None))
        if status == DoseEvent.Status.SNOOZED and not snoozed_until:
            raise serializers.ValidationError(
                {"snoozed_until": "Snoozed doses require a snoozed_until timestamp."}
            )
        return attrs

    def create(self, validated_data):
        event = DoseEvent.objects.create(**validated_data)
        if event.status in {DoseEvent.Status.TAKEN, DoseEvent.Status.MISSED}:
            event.acted_at = timezone.now()
            event.save(update_fields=["acted_at"])
        return event


class DoseStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=DoseEvent.Status.choices)
    snoozed_until = serializers.DateTimeField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["status"] == DoseEvent.Status.SNOOZED and not attrs.get("snoozed_until"):
            raise serializers.ValidationError(
                {"snoozed_until": "This field is required when snoozing a dose."}
            )
        return attrs
