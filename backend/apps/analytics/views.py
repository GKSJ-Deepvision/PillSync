from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.adherence.models import AdherenceLog

from .models import AdherenceAnalyticsReport
from .serializers import AdherenceAnalyticsReportSerializer


class AdherenceAnalyticsViewSet(viewsets.ModelViewSet):
    queryset = AdherenceAnalyticsReport.objects.all()
    serializer_class = AdherenceAnalyticsReportSerializer

    def get_queryset(self):
        qs = AdherenceAnalyticsReport.objects.all()
        profile_id = self.request.query_params.get("profile_id")
        if profile_id:
            qs = qs.filter(patient_profile_id=profile_id)
        return qs

    @action(detail=False, methods=["get"])
    def trends(self, request):
        profile_id = request.query_params.get("profile_id")
        logs = AdherenceLog.objects.all()
        if profile_id:
            logs = logs.filter(patient_profile_id=profile_id)

        total = logs.count()
        taken = logs.filter(status=AdherenceLog.Status.TAKEN).count()
        missed = logs.filter(status=AdherenceLog.Status.MISSED).count()
        snoozed = logs.filter(status=AdherenceLog.Status.SNOOZED).count()

        adherence_pct = round((taken / total) * 100, 1) if total > 0 else 0.0

        # Sample 7-day breakdown trend
        days_data = []
        today = timezone.now().date()
        for i in range(6, -1, -1):
            day_date = today - timezone.timedelta(days=i)
            day_logs = logs.filter(action_date=day_date)
            day_taken = day_logs.filter(status=AdherenceLog.Status.TAKEN).count()
            day_missed = day_logs.filter(status=AdherenceLog.Status.MISSED).count()
            days_data.append(
                {
                    "date": day_date.strftime("%b %d"),
                    "taken": day_taken,
                    "missed": day_missed,
                }
            )

        return Response(
            {
                "overall_adherence_pct": adherence_pct,
                "total_recorded": total,
                "taken_count": taken,
                "missed_count": missed,
                "snoozed_count": snoozed,
                "weekly_trends": days_data,
            },
            status=status.HTTP_200_OK,
        )
