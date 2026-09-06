from rest_framework import serializers

from .models import Reminder


class ReminderSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(
        source="schedule.medicine.display_name",
        read_only=True,
    )

    class Meta:
        model = Reminder
        fields = [
            "id",
            "schedule",
            "medicine_name",
            "dose_datetime",
            "reminder_datetime",
            "status",
            "message",
            "sent_at",
            "taken_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "medicine_name",
            "dose_datetime",
            "reminder_datetime",
            "message",
            "sent_at",
            "taken_at",
            "created_at",
            "updated_at",
        ]
