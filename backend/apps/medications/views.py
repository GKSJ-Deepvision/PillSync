from rest_framework import viewsets

from .models import Dosage, MedicationSchedule, Medicine
from .serializers import DosageSerializer, MedicationScheduleSerializer, MedicineSerializer


class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        patient_id = self.request.query_params.get("patient")
        category = self.request.query_params.get("category")
        active = self.request.query_params.get("is_active")

        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        if category:
            queryset = queryset.filter(category=category)
        if active is not None:
            queryset = queryset.filter(is_active=active.lower() == "true")

        return queryset


class DosageViewSet(viewsets.ModelViewSet):
    queryset = Dosage.objects.all()
    serializer_class = DosageSerializer


class MedicationScheduleViewSet(viewsets.ModelViewSet):
    queryset = MedicationSchedule.objects.all()
    serializer_class = MedicationScheduleSerializer
