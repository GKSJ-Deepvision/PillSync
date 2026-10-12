from rest_framework import serializers


class AdherenceSummarySerializer(serializers.Serializer):
    days = serializers.IntegerField()
    total_scheduled = serializers.IntegerField()
    taken = serializers.IntegerField()
    missed = serializers.IntegerField()
    snoozed = serializers.IntegerField()
    adherence_percentage = serializers.FloatField()


class DashboardMetricsSerializer(serializers.Serializer):
    active_medicines = serializers.IntegerField()
    low_stock_medicines = serializers.IntegerField()
    pending_refills = serializers.IntegerField()
    weekly_adherence_rate = serializers.FloatField()
    weekly_doses_scheduled = serializers.IntegerField()
    weekly_doses_taken = serializers.IntegerField()
