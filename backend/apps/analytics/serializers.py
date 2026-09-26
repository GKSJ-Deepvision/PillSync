from rest_framework import serializers

from .models import AdherenceAnalyticsReport


class AdherenceAnalyticsReportSerializer(serializers.ModelSerializer):
    profile_name = serializers.CharField(source="patient_profile.name", read_only=True)

    class Meta:
        model = AdherenceAnalyticsReport
        fields = "__all__"
