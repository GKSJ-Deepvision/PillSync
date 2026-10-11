from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Reminder
from .serializers import ReminderSerializer


class ReminderViewSet(viewsets.ModelViewSet):
    queryset = Reminder.objects.all()
    serializer_class = ReminderSerializer

    def get_queryset(self):
        qs = Reminder.objects.all()
        profile_id = self.request.query_params.get("profile_id")
        if profile_id:
            qs = qs.filter(patient_profile_id=profile_id)
        return qs

    @action(detail=True, methods=["post"])
    def take(self, request, pk=None):
        from .services.actions import record_dose_action

        reminder = self.get_object()
        result = record_dose_action(reminder, "Taken", notes=request.data.get("notes", ""))
        return Response(result)

    @action(detail=True, methods=["post"])
    def miss(self, request, pk=None):
        from .services.actions import record_dose_action

        reminder = self.get_object()
        result = record_dose_action(reminder, "Missed", notes=request.data.get("notes", ""))
        return Response(result)

    @action(detail=True, methods=["post"])
    def snooze(self, request, pk=None):
        from .services.actions import record_dose_action

        reminder = self.get_object()
        result = record_dose_action(reminder, "Snoozed", notes=request.data.get("notes", ""))
        return Response(result)

    @action(detail=True, methods=["post"])
    def skip(self, request, pk=None):
        from .services.actions import record_dose_action

        reminder = self.get_object()
        result = record_dose_action(reminder, "Skipped", notes=request.data.get("notes", ""))
        return Response(result)
