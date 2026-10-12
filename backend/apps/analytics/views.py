from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services.aggregations import get_dashboard_metrics, get_patient_adherence_summary


class DashboardMetricsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        patient_id = request.query_params.get("patient")
        metrics = get_dashboard_metrics(patient_id)
        return Response(metrics, status=status.HTTP_200_OK)


class AdherenceSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        patient_id = request.query_params.get("patient")
        days = int(request.query_params.get("days", 30))

        if not patient_id:
            return Response(
                {"error": "patient query param is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        summary = get_patient_adherence_summary(patient_id, days=days)
        return Response(summary, status=status.HTTP_200_OK)
