from django.utils import timezone
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Reminder, ReminderStatus
from .serializers import ReminderSerializer


class ReminderListView(generics.ListAPIView):
    serializer_class = ReminderSerializer

    def get_queryset(self):
        patient_id = self.request.query_params.get("patient_id")

        queryset = Reminder.objects.select_related(
            "schedule",
            "schedule__medicine",
        )

        if patient_id:
            queryset = queryset.filter(
                schedule__medicine__patient_id=patient_id,
            )

        return queryset


class TodayReminderListView(generics.ListAPIView):
    serializer_class = ReminderSerializer

    def get_queryset(self):
        patient_id = self.request.query_params.get("patient_id")
        today = timezone.localdate()

        queryset = Reminder.objects.select_related(
            "schedule",
            "schedule__medicine",
        ).filter(
            dose_datetime__date=today,
        )

        if patient_id:
            queryset = queryset.filter(
                schedule__medicine__patient_id=patient_id,
            )

        return queryset


class UpcomingReminderListView(generics.ListAPIView):
    serializer_class = ReminderSerializer

    def get_queryset(self):
        patient_id = self.request.query_params.get("patient_id")
        now = timezone.now()

        queryset = Reminder.objects.select_related(
            "schedule",
            "schedule__medicine",
        ).filter(
            dose_datetime__gte=now,
            status=ReminderStatus.PENDING,
        )

        if patient_id:
            queryset = queryset.filter(
                schedule__medicine__patient_id=patient_id,
            )

        return queryset


class ReminderStatusUpdateView(APIView):
    def patch(self, request, pk):
        try:
            reminder = Reminder.objects.get(
                pk=pk,
                schedule__medicine__patient_id=request.data.get("patient_id"),
            )
        except Reminder.DoesNotExist:
            return Response(
                {"detail": "Reminder not found."},
                status=404,
            )

        status = request.data.get("status")

        if status not in ReminderStatus.values:
            return Response(
                {"detail": "Invalid reminder status."},
                status=400,
            )

        reminder.status = status

        if status == ReminderStatus.TAKEN:
            reminder.taken_at = timezone.now()

        reminder.save()

        return Response(ReminderSerializer(reminder).data)
