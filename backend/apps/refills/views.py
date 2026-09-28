from rest_framework.response import Response
from rest_framework.views import APIView

from apps.medications.models import Medicine

from .services.prediction import (
    REFILL_LEAD_DAYS,
    get_dosage_analysis,
    get_refill_predictions,
    predict_refill,
)


class RefillPredictionView(APIView):
    def get(self, request):
        patient_id = request.query_params.get("patient")
        if not patient_id:
            return Response(
                {"detail": "patient query parameter is required."},
                status=400,
            )

        try:
            lead_days = int(request.query_params.get("lead_days", REFILL_LEAD_DAYS))
            if not 0 <= lead_days <= 30:
                raise ValueError
        except (TypeError, ValueError):
            return Response(
                {"detail": "lead_days must be an integer between 0 and 30."},
                status=400,
            )

        results = get_refill_predictions(patient_id, lead_days)
        return Response(
            {
                "patient_id": patient_id,
                "lead_days": lead_days,
                "count": len(results),
                "predictions": results,
            }
        )


class RefillPredictionDetailView(APIView):
    def get(self, request, medicine_id):
        patient_id = request.query_params.get("patient")
        try:
            medicine = Medicine.objects.get(
                id=medicine_id,
                patient_id=patient_id,
                is_active=True,
            )
        except Medicine.DoesNotExist:
            return Response({"detail": "Medicine not found."}, status=404)

        return Response(predict_refill(medicine))


class DosageAnalysisView(APIView):
    def get(self, request):
        patient_id = request.query_params.get("patient")
        if not patient_id:
            return Response(
                {"detail": "patient query parameter is required."},
                status=400,
            )

        results = get_dosage_analysis(patient_id)
        return Response(
            {
                "patient_id": patient_id,
                "count": len(results),
                "medications": results,
            }
        )
