from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.medications.models import Medicine
from apps.refills.models import RefillPrediction
from apps.refills.services.prediction import calculate_refill_prediction
from apps.reminders.models import Reminder


class RefillPredictionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, medicine_id):
        try:
            medicine = Medicine.objects.get(
                pk=medicine_id,
                user=request.user,
                is_active=True,
            )
        except Medicine.DoesNotExist:
            return Response(
                {"detail": "Medicine not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        dosage = medicine.dosages.first()

        if dosage is None:
            return Response(
                {"detail": "Dosage information not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        missed_doses = Reminder.objects.filter(
            schedule__dosage__medicine=medicine,
            status=Reminder.Status.MISSED,
        ).count()

        try:
            prediction = calculate_refill_prediction(
                stock_quantity=medicine.stock_quantity,
                quantity_per_dose=dosage.quantity_per_dose,
                frequency_per_day=dosage.frequency_per_day,
                missed_doses=missed_doses,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refill_prediction, _ = RefillPrediction.objects.update_or_create(
            medicine=medicine,
            defaults={
                "remaining_stock": prediction["remaining_stock"],
                "average_daily_consumption": prediction[
                    "average_daily_consumption"
                ],
                "estimated_depletion_date": prediction[
                    "estimated_depletion_date"
                ],
                "recommended_refill_date": prediction[
                    "recommended_refill_date"
                ],
            },
        )

        return Response(
            {
                "medicine_id": medicine.id,
                "medicine_name": medicine.name,
                "remaining_stock": prediction["remaining_stock"],
                "average_daily_consumption": prediction[
                    "average_daily_consumption"
                ],
                "days_remaining": prediction["days_remaining"],
                "missed_doses": prediction["missed_doses"],
                "estimated_depletion_date": prediction[
                    "estimated_depletion_date"
                ],
                "recommended_refill_date": prediction[
                    "recommended_refill_date"
                ],
                 "low_stock_alert": prediction["low_stock_alert"],
                 "low_stock_message": prediction["low_stock_message"],
                 "prediction_id": refill_prediction.id,
            },
            status=status.HTTP_200_OK,
        )
class StockUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, medicine_id):
        try:
            medicine = Medicine.objects.get(
                pk=medicine_id,
                user=request.user,
                is_active=True,
            )
        except Medicine.DoesNotExist:
            return Response(
                {"detail": "Medicine not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        adjustment = request.data.get("adjustment")

        if adjustment is None:
            return Response(
                {"detail": "adjustment is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            adjustment = int(adjustment)
        except (TypeError, ValueError):
            return Response(
                {"detail": "adjustment must be a number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_stock = medicine.stock_quantity + adjustment

        if new_stock < 0:
            return Response(
                {"detail": "Stock quantity cannot be negative."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        medicine.stock_quantity = new_stock
        medicine.save(update_fields=["stock_quantity", "updated_at"])

        return Response(
            {
                "medicine_id": medicine.id,
                "medicine_name": medicine.name,
                "previous_stock": new_stock - adjustment,
                "adjustment": adjustment,
                "new_stock": medicine.stock_quantity,
                "message": "Stock updated successfully.",
            },
            status=status.HTTP_200_OK,
        )