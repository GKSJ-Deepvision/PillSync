from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import AdherenceLog
from .serializers import AdherenceLogSerializer


class AdherenceLogViewSet(viewsets.ModelViewSet):
    queryset = AdherenceLog.objects.all()
    serializer_class = AdherenceLogSerializer

    def get_queryset(self):
        qs = AdherenceLog.objects.all()
        profile_id = self.request.query_params.get("profile_id")
        status_param = self.request.query_params.get("status")

        if profile_id:
            qs = qs.filter(patient_profile_id=profile_id)
        if status_param:
            qs = qs.filter(status=status_param)

        return qs

    @action(detail=False, methods=["get"])
    def summary(self, request):
        qs = self.get_queryset()
        total_logs = qs.count()
        taken_count = qs.filter(status=AdherenceLog.Status.TAKEN).count()
        missed_count = qs.filter(status=AdherenceLog.Status.MISSED).count()
        snoozed_count = qs.filter(status=AdherenceLog.Status.SNOOZED).count()

        adherence_percentage = round((taken_count / total_logs) * 100, 1) if total_logs > 0 else 0

        return Response(
            {
                "total_logs": total_logs,
                "taken_count": taken_count,
                "missed_count": missed_count,
                "snoozed_count": snoozed_count,
                "adherence_percentage": adherence_percentage,
            }
        )
