from rest_framework import serializers

from apps.adherence.models import AdherenceLog


class AdherenceLogSerializer(serializers.ModelSerializer):
    medication_name = serializers.CharField(source="medication.name", read_only=True)

    class Meta:
        model = AdherenceLog
        fields = [
            "id",
            "medication",
            "medication_name",
            "reminder",
            "status",
            "period",
            "scheduled_time",
            "logged_at",
            "notes",
        ]


class CreateAdherenceLogSerializer(serializers.Serializer):
    medication_id = serializers.IntegerField()
    reminder_id = serializers.IntegerField(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=["taken", "missed", "snoozed"], default="taken")
    period = serializers.ChoiceField(choices=["Morning", "Afternoon", "Night"], default="Morning")
    scheduled_time = serializers.CharField(default="08:00 AM", required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
