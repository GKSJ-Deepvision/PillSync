from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.adherence.models import AdherenceLog
from apps.adherence.serializers import AdherenceLogSerializer, CreateAdherenceLogSerializer
from apps.adherence.services.metrics import AdherenceMetricsService
from apps.medications.models import Medication
from apps.reminders.models import Reminder


class AdherenceMetricsView(APIView):
    """Get overall adherence metrics, streaks, period breakdown, and weekly trends."""

    def get(self, request):
        service = AdherenceMetricsService()
        data = service.get_adherence_summary()
        return Response(data, status=status.HTTP_200_OK)


class AdherenceHistoryView(APIView):
    """Get historical dose events list."""

    def get(self, request):
        logs = AdherenceLog.objects.all().order_by("-logged_at")
        serializer = AdherenceLogSerializer(logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LogAdherenceView(APIView):
    """Record dose intake, missed, or snoozed event."""

    def post(self, request):
        serializer = CreateAdherenceLogSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated = serializer.validated_data
        try:
            medication = Medication.objects.get(id=validated["medication_id"])
        except Medication.DoesNotExist:
            return Response({"detail": "Medication not found"}, status=status.HTTP_404_NOT_FOUND)

        reminder = None
        if validated.get("reminder_id"):
            reminder = Reminder.objects.filter(id=validated["reminder_id"]).first()

        log_entry = AdherenceLog.objects.create(
            medication=medication,
            reminder=reminder,
            status=validated["status"],
            period=validated["period"],
            scheduled_time=validated.get("scheduled_time", "08:00 AM"),
            notes=validated.get("notes", ""),
        )

        # Update medication stock if status is 'taken'
        if validated["status"] == "taken" and medication.stock > 0:
            medication.stock -= 1
            medication.update_stock_days()
            medication.save()

        # Update reminder status if linked
        if reminder:
            reminder.status = validated["status"]
            reminder.save()

        return Response(
            {
                "message": f"Dose logged as {validated['status']} for {medication.name}",
                "log": AdherenceLogSerializer(log_entry).data,
                "current_stock": medication.stock,
            },
            status=status.HTTP_201_CREATED,
        )
