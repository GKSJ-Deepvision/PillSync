"""Analytics endpoints."""

from __future__ import annotations

from uuid import UUID

from django.http import Http404
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsAdmin, IsCaregiver

from . import metrics
from .services import dashboard


@extend_schema(
    tags=["analytics"],
    parameters=[OpenApiParameter("patient", str, description="Limit to one patient profile")],
    responses={200: None},
)
class DashboardView(APIView):
    """The patient dashboard, for whichever profiles the caller may see."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        patients = request.user.accessible_patient_profiles()
        patient_id = request.query_params.get("patient")
        if patient_id:
            try:
                UUID(patient_id)
            except ValueError:
                raise Http404("No such patient.") from None
            patients = patients.filter(pk=patient_id)
            if not patients.exists():
                raise Http404("No such patient.")
        return Response(dashboard.patient_dashboard(patients))


@extend_schema(tags=["analytics"], responses={200: None})
class CaregiverOverviewView(APIView):
    """Everyone the caregiver looks after, most in need of attention first."""

    permission_classes = [IsAuthenticated, IsCaregiver]

    def get(self, request):
        return Response(dashboard.caregiver_overview(request.user))


@extend_schema(tags=["analytics"], responses={200: None})
class AdminOverviewView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response(dashboard.admin_overview())


@extend_schema(tags=["analytics"], responses={200: None})
class PerformanceView(APIView):
    """Latency percentiles over the recent request window (administrators only)."""

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response(metrics.summarise(metrics.store.snapshot()))
