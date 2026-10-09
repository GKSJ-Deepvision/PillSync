"""Serializers for dose events — reminders on the way out, history on the way back."""

from __future__ import annotations

from decimal import Decimal

from rest_framework import serializers

from apps.reminders.models import MAX_SNOOZES, SNOOZE_MINUTES, DoseEvent


class DoseEventSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source="medicine.display_name", read_only=True)
    medicine_strength = serializers.SerializerMethodField()
    medicine_category = serializers.CharField(source="medicine.category", read_only=True)
    instructions = serializers.CharField(source="medicine.instructions", read_only=True)
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    slot_display = serializers.CharField(source="get_slot_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    can_snooze = serializers.BooleanField(read_only=True)
    effective_time = serializers.DateTimeField(read_only=True)

    class Meta:
        model = DoseEvent
        fields = (
            "id",
            "schedule",
            "medicine",
            "medicine_name",
            "medicine_strength",
            "medicine_category",
            "instructions",
            "patient",
            "patient_name",
            "scheduled_for",
            "effective_time",
            "slot",
            "slot_display",
            "quantity_expected",
            "quantity_taken",
            "status",
            "status_display",
            "is_overdue",
            "can_snooze",
            "snooze_until",
            "snooze_count",
            "responded_at",
            "reminder_sent_at",
            "caregiver_alerted_at",
            "notes",
        )
        # Every field is read-only: a dose changes state through the take,
        # miss, skip and snooze actions, never by a client PATCHing `status`.
        read_only_fields = fields

    def get_medicine_strength(self, obj: DoseEvent) -> str:
        return f"{obj.medicine.strength} {obj.medicine.strength_unit}".strip()


class DoseActionSerializer(serializers.Serializer):
    """Payload shared by the take / miss / skip actions."""

    notes = serializers.CharField(max_length=255, required=False, allow_blank=True)


class TakeDoseSerializer(DoseActionSerializer):
    quantity_taken = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        min_value=Decimal("0.01"),
        required=False,
        help_text="Defaults to the scheduled quantity. Set it when a partial dose was taken.",
    )


class SnoozeSerializer(serializers.Serializer):
    minutes = serializers.IntegerField(
        min_value=1,
        max_value=240,
        default=SNOOZE_MINUTES,
        help_text=f"How long to postpone. A dose can be snoozed at most {MAX_SNOOZES} times.",
    )


class DailyDoseSummarySerializer(serializers.Serializer):
    """One day of medication history."""

    date = serializers.DateField()
    total = serializers.IntegerField()
    taken = serializers.IntegerField()
    missed = serializers.IntegerField()
    skipped = serializers.IntegerField()
    pending = serializers.IntegerField()
    adherence_percent = serializers.FloatField(
        help_text="Taken as a share of doses that were due and resolved."
    )


class TodayScheduleSerializer(serializers.Serializer):
    """Today's doses, grouped the way the specification names the day."""

    date = serializers.DateField()
    slots = serializers.DictField(child=DoseEventSerializer(many=True))
    summary = DailyDoseSummarySerializer()
