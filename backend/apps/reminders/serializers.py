from rest_framework import serializers

from .models import Reminder


class ReminderSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(
        source="schedule.dosage.medicine.name",
        read_only=True,
    )

    class Meta:
        model = Reminder
        fields = (
            "id",
            "schedule",
            "medicine_name",
            "reminder_date",
            "scheduled_time",
            "status",
            "snoozed_until",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "medicine_name",
            "created_at",
            "updated_at",
        )