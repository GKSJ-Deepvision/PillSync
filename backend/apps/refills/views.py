from ml.src.refill_prediction.engine import RefillPredictionEngine
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import RefillPrediction, RefillRequest
from .serializers import RefillPredictionSerializer, RefillRequestSerializer


class RefillPredictionViewSet(viewsets.ModelViewSet):
    queryset = RefillPrediction.objects.all()
    serializer_class = RefillPredictionSerializer

    def get_queryset(self):
        qs = RefillPrediction.objects.all()
        profile_id = self.request.query_params.get("profile_id")
        if profile_id:
            qs = qs.filter(patient_profile_id=profile_id)
        return qs

    @action(detail=False, methods=["post"])
    def calculate(self, request):
        stock = int(request.data.get("stock", 60))
        daily_freq = float(request.data.get("daily_frequency", 2.0))
        qty_per_dose = float(request.data.get("qty_per_dose", 1.0))
        missed = int(request.data.get("missed_doses", 0))
        med_name = request.data.get("medicine_name", "Medication")

        res = RefillPredictionEngine.predict_depletion(
            initial_stock=stock,
            daily_dosage_frequency=daily_freq,
            quantity_per_dose=qty_per_dose,
            missed_doses=missed,
            medicine_name=med_name,
        )
        return Response(res, status=status.HTTP_200_OK)


class RefillRequestViewSet(viewsets.ModelViewSet):
    queryset = RefillRequest.objects.all()
    serializer_class = RefillRequestSerializer

    def get_queryset(self):
        qs = RefillRequest.objects.all()
        profile_id = self.request.query_params.get("profile_id")
        if profile_id:
            qs = qs.filter(patient_profile_id=profile_id)
        return qs
