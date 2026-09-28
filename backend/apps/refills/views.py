from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.medications.models import Medication
from apps.refills.models import RefillLog
from apps.refills.serializers import (
    RefillLogSerializer,
    RequestRefillSerializer,
    StockUpdateSerializer,
)
from apps.refills.services.prediction import RefillPredictionService


class RefillPredictionsView(APIView):
    """Get refill predictions and stock depletion metrics for all medications."""

    def get(self, request):
        service = RefillPredictionService()
        predictions = service.get_all_predictions()
        return Response(predictions, status=status.HTTP_200_OK)


class LowStockAlertsView(APIView):
    """Get list of medications that have fallen below refill threshold."""

    def get(self, request):
        service = RefillPredictionService()
        low_stock = service.get_low_stock_medications()
        return Response(low_stock, status=status.HTTP_200_OK)


class StockUpdateView(APIView):
    """Manually update stock level for a medication."""

    def post(self, request):
        serializer = StockUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        med_id = serializer.validated_data["medication_id"]
        new_stock = serializer.validated_data["new_stock"]

        try:
            medication = Medication.objects.get(id=med_id)
            medication.stock = new_stock
            medication.update_stock_days()
            medication.save()

            service = RefillPredictionService()
            prediction = service.get_medication_prediction(medication)

            return Response(
                {
                    "message": f"Stock updated for {medication.name}",
                    "prediction": prediction,
                },
                status=status.HTTP_200_OK,
            )
        except Medication.DoesNotExist:
            return Response({"detail": "Medication not found"}, status=status.HTTP_404_NOT_FOUND)


class RequestRefillView(APIView):
    """Request a refill order for a medication."""

    def post(self, request):
        serializer = RequestRefillSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        med_id = serializer.validated_data["medication_id"]
        quantity = serializer.validated_data["quantity"]
        notes = serializer.validated_data.get("notes", "")

        try:
            medication = Medication.objects.get(id=med_id)
            refill_log = RefillLog.objects.create(
                medication=medication,
                quantity_requested=quantity,
                status="pending",
                notes=notes,
            )

            return Response(
                {
                    "message": f"Refill order requested for {medication.name}",
                    "refill_log": RefillLogSerializer(refill_log).data,
                },
                status=status.HTTP_201_CREATED,
            )
        except Medication.DoesNotExist:
            return Response({"detail": "Medication not found"}, status=status.HTTP_404_NOT_FOUND)
