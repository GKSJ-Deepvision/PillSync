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
    def history(self, request):
        qs = self.get_queryset()
        by_date = {}
        for log in qs:
            d_str = str(log.action_date)
            if d_str not in by_date:
                by_date[d_str] = {"date": d_str, "taken": 0, "missed": 0, "total": 0, "items": []}
            by_date[d_str]["total"] += 1
            if log.status == AdherenceLog.Status.TAKEN:
                by_date[d_str]["taken"] += 1
            elif log.status == AdherenceLog.Status.MISSED:
                by_date[d_str]["missed"] += 1
            by_date[d_str]["items"].append(AdherenceLogSerializer(log).data)

        history_list = sorted(by_date.values(), key=lambda x: x["date"], reverse=True)
        return Response({"history": history_list, "total_records": qs.count()})

    @action(detail=False, methods=["get"])
    def summary(self, request):

        qs = self.get_queryset()
        total_logs = qs.count()
        taken_count = qs.filter(status=AdherenceLog.Status.TAKEN).count()
        missed_count = qs.filter(status=AdherenceLog.Status.MISSED).count()
        snoozed_count = qs.filter(status=AdherenceLog.Status.SNOOZED).count()

        adherence_percentage = round((taken_count / total_logs) * 100, 1) if total_logs > 0 else 0

        # Check for CSV format export
        export_format = request.query_params.get("format", "").lower()
        if export_format == "csv":
            import csv

            from django.http import HttpResponse

            response = HttpResponse(content_type="text/csv")
            response["Content-Disposition"] = 'attachment; filename="adherence_summary.csv"'
            writer = csv.writer(response)
            writer.writerow(["Date", "Time", "Medicine", "Dosage", "Status", "Notes"])
            for log in qs:
                writer.writerow(
                    [
                        log.action_date,
                        log.action_time,
                        log.medicine_name,
                        log.dosage,
                        log.status,
                        log.notes,
                    ]
                )
            return response

        return Response(
            {
                "total_logs": total_logs,
                "taken_count": taken_count,
                "missed_count": missed_count,
                "snoozed_count": snoozed_count,
                "adherence_percentage": adherence_percentage,
            }
        )
