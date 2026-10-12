from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.medications.models import Medicine

from .models import RefillRequest
from .serializers import RefillRequestSerializer
from .services.prediction import calculate_refill_prediction


class RefillRequestListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = RefillRequestSerializer

    def get_queryset(self):
        queryset = RefillRequest.objects.all()
        patient_id = self.request.query_params.get("patient")
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset


class RefillPredictionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, medicine_id):
        try:
            medicine = Medicine.objects.get(id=medicine_id)
        except Medicine.DoesNotExist:
            return Response(
                {"error": "Medicine not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        prediction = calculate_refill_prediction(medicine)
        return Response(prediction, status=status.HTTP_200_OK)
