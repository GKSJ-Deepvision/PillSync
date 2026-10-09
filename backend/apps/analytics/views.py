from datetime import datetime

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import CaregiverPatientRelationship, User

from .serializers import DashboardAnalyticsSerializer
from .services.dashboard import build_dashboard


class DashboardAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date, end_date, error = _parse_dates(request.query_params)
        if error:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)
        data = build_dashboard(
            request.user,
            start_date=start_date,
            end_date=end_date,
        )
        return Response(DashboardAnalyticsSerializer(data).data)


class CaregiverDashboardAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        if request.user.role != User.Role.CAREGIVER:
            return Response(
                {"detail": "Patient dashboard not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        relationship = (
            CaregiverPatientRelationship.objects.filter(
                caregiver=request.user,
                patient_id=patient_id,
                patient__role=User.Role.PATIENT,
            )
            .select_related("patient")
            .first()
        )
        if relationship is None:
            return Response(
                {"detail": "Patient dashboard not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        start_date, end_date, error = _parse_dates(request.query_params)
        if error:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)
        data = build_dashboard(
            relationship.patient,
            start_date=start_date,
            end_date=end_date,
        )
        return Response(DashboardAnalyticsSerializer(data).data)


def _parse_dates(params):
    start_date = params.get("start_date")
    end_date = params.get("end_date")
    try:
        parsed_start = datetime.strptime(start_date, "%Y-%m-%d").date() if start_date else None
        parsed_end = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else None
    except ValueError:
        return None, None, "Dates must use YYYY-MM-DD format."
    if parsed_start and parsed_end and parsed_start > parsed_end:
        return None, None, "start_date must be on or before end_date."
    return parsed_start, parsed_end, None
