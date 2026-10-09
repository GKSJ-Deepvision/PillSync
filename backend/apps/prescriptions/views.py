"""Prescription endpoints."""

from __future__ import annotations

from datetime import timedelta

from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.choices import PrescriptionStatus
from apps.common.permissions import IsProfileOwnerOrAssignedCaregiver

from .models import Prescription
from .serializers import PrescriptionSerializer


@extend_schema(tags=["prescriptions"])
class PrescriptionViewSet(viewsets.ModelViewSet):
    """Prescriptions, uploaded by hand in Milestone 2 and by OCR in Milestone 3."""

    queryset = Prescription.objects.none()
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated, IsProfileOwnerOrAssignedCaregiver]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filterset_fields = ["patient", "status"]
    search_fields = ["doctor_name", "clinic_name", "reference_number", "notes"]
    ordering_fields = ["issued_on", "expires_on", "created_at"]

    def get_queryset(self):
        return Prescription.objects.filter(
            patient__in=self.request.user.accessible_patient_profiles()
        ).select_related("patient")

    def perform_destroy(self, instance: Prescription) -> None:
        # Medicines point at prescriptions; archiving keeps that link intact.
        instance.status = PrescriptionStatus.ARCHIVED
        instance.save(update_fields=["status", "updated_at"])

    @extend_schema(responses={200: PrescriptionSerializer(many=True)})
    @action(detail=False, methods=["get"])
    def expiring(self, request):
        """Prescriptions running out within the next 30 days."""
        today = timezone.localdate()
        queryset = (
            self.filter_queryset(self.get_queryset())
            .filter(
                status=PrescriptionStatus.ACTIVE,
                expires_on__isnull=False,
                expires_on__gte=today,
                expires_on__lte=today + timedelta(days=30),
            )
            .order_by("expires_on")
        )
        return Response(self.get_serializer(queryset, many=True).data)
