"""Adherence endpoints."""

from __future__ import annotations

from django.http import HttpResponse
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import reports


class QuerySerializer(serializers.Serializer):
    patient = serializers.UUIDField(required=False)
    medicine = serializers.UUIDField(required=False)
    days = serializers.IntegerField(required=False, min_value=7, max_value=180, default=30)


class ScopedView(APIView):
    """Resolves which patients a request may cover.

    Everything is limited to profiles the caller can access, so passing someone
    else's id yields a 404 rather than their data.
    """

    permission_classes = [IsAuthenticated]

    def patients(self, request, patient_id=None):
        from django.http import Http404

        accessible = request.user.accessible_patient_profiles()
        if patient_id is not None:
            scoped = accessible.filter(pk=patient_id)
            if not scoped.exists():
                raise Http404("No such patient.")
            return scoped
        return accessible


@extend_schema(
    tags=["adherence"],
    parameters=[
        OpenApiParameter("patient", str, description="Limit to one patient profile"),
        OpenApiParameter("medicine", str, description="Limit to one medicine"),
        OpenApiParameter("days", int, description="Window length, 7-180 (default 30)"),
    ],
    responses={200: None},
)
class AdherenceSummaryView(ScopedView):
    def get(self, request):
        query = QuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        data = query.validated_data
        patients = self.patients(request, data.get("patient"))

        medicine = None
        if data.get("medicine"):
            from django.http import Http404

            from apps.medications.models import Medicine

            medicine = Medicine.objects.filter(pk=data["medicine"], patient__in=patients).first()
            if medicine is None:
                raise Http404("No such medicine.")

        return Response(reports.summary(patients, data["days"], medicine=medicine))


@extend_schema(
    tags=["adherence"],
    parameters=[
        OpenApiParameter("period", str, enum=["weekly", "monthly"]),
        OpenApiParameter("patient", str),
        OpenApiParameter("format", str, enum=["json", "csv"]),
    ],
    responses={200: None},
)
class AdherenceReportView(ScopedView):
    def get(self, request):
        period = request.query_params.get("period", "weekly")
        if period not in reports.PERIODS:
            return Response({"period": "Use weekly or monthly."}, status=400)

        patient_id = request.query_params.get("patient")
        if patient_id:
            try:
                serializers.UUIDField().run_validation(patient_id)
            except serializers.ValidationError:
                return Response({"patient": "Not a valid id."}, status=400)
        data = reports.report(self.patients(request, patient_id), period)

        if request.query_params.get("export") == "csv":
            response = HttpResponse(reports.report_csv(data), content_type="text/csv")
            response["Content-Disposition"] = (
                f'attachment; filename="pillsync-adherence-{period}-{data["end"]:%Y%m%d}.csv"'
            )
            return response
        return Response(data)
