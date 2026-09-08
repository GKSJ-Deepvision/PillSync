from rest_framework import serializers

from .models import AdherenceLog


class AdherenceLogSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient_profile.name", read_only=True)

    class Meta:
        model = AdherenceLog
        fields = "__all__"
