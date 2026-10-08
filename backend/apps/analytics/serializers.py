from rest_framework import serializers


class RefillPredictionAnalyticsSerializer(serializers.Serializer):
    daily_consumption = serializers.IntegerField(allow_null=True)
    days_remaining = serializers.IntegerField(allow_null=True)
    predicted_refill_date = serializers.DateField(allow_null=True)
    is_fallback = serializers.BooleanField(allow_null=True)


class MedicineAnalyticsSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    dosage = serializers.CharField()
    quantity = serializers.IntegerField()
    refill_threshold = serializers.IntegerField()
    is_low_stock = serializers.BooleanField()
    refill_prediction = RefillPredictionAnalyticsSerializer(allow_null=True)


class UpcomingReminderAnalyticsSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    medicine_name = serializers.CharField()
    scheduled_at = serializers.DateTimeField()
    period = serializers.CharField()
    status = serializers.CharField()


class DashboardAnalyticsSerializer(serializers.Serializer):
    summary = serializers.DictField()
    adherence = serializers.DictField()
    history = serializers.DictField()
    active_medicines = MedicineAnalyticsSerializer(many=True)
    upcoming_reminders = UpcomingReminderAnalyticsSerializer(many=True)
