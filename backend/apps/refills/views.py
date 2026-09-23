from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.supabase_auth import SupabaseJWTAuthentication

from .models import RefillCheck
from .serializers import RefillCheckRequestSerializer, RefillCheckSerializer
from .services import (
    days_of_stock_remaining,
    estimated_depletion_date,
    is_low_stock,
    recommended_refill_date,
    refill_notification_message,
)


class RefillCheckView(APIView):
    """
    POST current stock + daily consumption for a medication -> returns the
    predicted depletion date, a recommended refill-by date, and whether
    it's currently low stock. Persists the check for history/audit.
    The patient is the signed-in user (Supabase token); a client-sent patient_id is ignored.
    (This is the what-if calculator; the live forecast from real dose history is the
    refill_forecast() SQL function used by the Refills page.)
    """

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        req = RefillCheckRequestSerializer(data=request.data)
        req.is_valid(raise_exception=True)
        data = req.validated_data

        quantity = data["quantity_on_hand"]
        consumption = data["daily_consumption"]

        days_left = days_of_stock_remaining(quantity, consumption)
        depletion = estimated_depletion_date(quantity, consumption)
        refill_by = recommended_refill_date(
            quantity, consumption, lead_time_days=data["lead_time_days"]
        )
        low_stock = is_low_stock(
            quantity, consumption, threshold_days=data["low_stock_threshold_days"]
        )

        check = RefillCheck.objects.create(
            medication_id=data["medication_id"],
            patient_id=request.user.id,
            quantity_on_hand=quantity,
            daily_consumption=consumption,
            days_remaining=days_left,
            depletion_date=depletion,
            recommended_refill_date=refill_by,
            is_low_stock=low_stock,
        )

        payload = RefillCheckSerializer(check).data
        if low_stock and days_left is not None:
            payload["message"] = refill_notification_message(
                data.get("medicine_name") or "medicine", days_left
            )

        return Response(payload, status=status.HTTP_201_CREATED)
