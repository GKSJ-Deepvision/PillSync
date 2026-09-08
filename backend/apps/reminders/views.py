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
        reminder = self.get_object()
        reminder.status = Reminder.Status.TAKEN
        reminder.save()
        return Response(ReminderSerializer(reminder).data)

    @action(detail=True, methods=["post"])
    def miss(self, request, pk=None):
        reminder = self.get_object()
        reminder.status = Reminder.Status.MISSED
        reminder.save()
        return Response(ReminderSerializer(reminder).data)

    @action(detail=True, methods=["post"])
    def snooze(self, request, pk=None):
        reminder = self.get_object()
        reminder.status = Reminder.Status.SNOOZED
        reminder.save()
        return Response(ReminderSerializer(reminder).data)
