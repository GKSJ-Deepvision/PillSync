from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.medications.models import Medication

from .models import DoseEvent
from .serializers import DoseEventSerializer, DoseStatusSerializer
from .services import history_queryset, history_summary, parse_date


class DoseEventViewSet(viewsets.ModelViewSet):
    serializer_class = DoseEventSerializer

    def get_queryset(self):
        queryset = DoseEvent.objects.select_related("medication", "schedule")
        if self.request.user.is_authenticated:
            queryset = queryset.filter(medication__owner=self.request.user)
        else:
            queryset = queryset.filter(medication__owner__isnull=True)
        return queryset

    def perform_create(self, serializer):
        medication = serializer.validated_data["medication"]
        if self.request.user.is_authenticated and medication.owner_id != self.request.user.id:
            raise PermissionDenied("You cannot record a dose for another user's medication.")
        serializer.save()

    def update(self, request, *args, **kwargs):
        if set(request.data).issubset({"status", "snoozed_until", "notes"}):
            event = self.get_object()
            status_serializer = DoseStatusSerializer(data=request.data)
            status_serializer.is_valid(raise_exception=True)
            values = status_serializer.validated_data
            event.status = values["status"]
            event.snoozed_until = values.get("snoozed_until")
            event.notes = values.get("notes", event.notes)
            event.acted_at = None if event.status == DoseEvent.Status.SNOOZED else timezone.now()
            event.save(update_fields=["status", "snoozed_until", "notes", "acted_at"])
            return Response(self.get_serializer(event).data)
        return super().update(request, *args, **kwargs)


class MedicationHistoryView(APIView):
    def get(self, request):
        queryset = DoseEvent.objects.select_related("medication", "schedule")
        if request.user.is_authenticated:
            queryset = queryset.filter(medication__owner=request.user)
        else:
            queryset = queryset.filter(medication__owner__isnull=True)
        try:
            queryset = history_queryset(
                queryset,
                start_date=parse_date(request.query_params.get("start_date")),
                end_date=parse_date(request.query_params.get("end_date")),
                medication_id=request.query_params.get("medication"),
            )
        except ValueError:
            return Response(
                {"detail": "Dates must use YYYY-MM-DD format."}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response(
            {
                "summary": history_summary(queryset),
                "events": DoseEventSerializer(queryset, many=True).data,
            }
        )


class MedicationHistoryCreateView(APIView):
    def post(self, request):
        medication = get_object_or_404(Medication, pk=request.data.get("medication"))
        if request.user.is_authenticated and medication.owner_id != request.user.id:
            return Response({"detail": "You cannot record a dose for this medication."}, status=403)
        serializer = DoseEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
