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
        from datetime import date as dt_date
        from datetime import datetime, time

        from django.db.models import Q

        patient_id = (
            self.request.query_params.get("patient_id")
            if hasattr(self.request, "query_params")
            else self.request.GET.get("patient_id")
        )
        today = timezone.localdate()
        sys_today = dt_date.today()
        min_date = min(today, sys_today)
        max_date = max(today, sys_today)

        start_of_day = timezone.make_aware(datetime.combine(min_date, time.min))
        end_of_day = timezone.make_aware(datetime.combine(max_date, time.max))

        queryset = Reminder.objects.select_related(
            "schedule",
            "schedule__medicine",
        ).filter(
            Q(dose_datetime__date=today)
            | Q(dose_datetime__date=sys_today)
            | Q(dose_datetime__range=(start_of_day, end_of_day))
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
