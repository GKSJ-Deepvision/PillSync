from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.medicines.models import Medicine

from .serializers import RefillPredictionSerializer
from .services import RefillPredictionService


class RefillPredictionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, medicine_id):
        medicine = get_object_or_404(
            Medicine.objects.filter(user=request.user),
            pk=medicine_id,
        )

        try:
            prediction = RefillPredictionService().predict(medicine)
        except ValidationError as exc:
            return Response(
                {"detail": exc.message_dict if hasattr(exc, "message_dict") else exc.messages},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(RefillPredictionSerializer(prediction).data)
