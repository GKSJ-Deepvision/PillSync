from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Prescription
from .serializers import PrescriptionSerializer


class PrescriptionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PrescriptionSerializer

    def get_queryset(self):
        queryset = Prescription.objects.all()
        patient_id = self.request.query_params.get("patient")
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset


class PrescriptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
