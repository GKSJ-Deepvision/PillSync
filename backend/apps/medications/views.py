from rest_framework import viewsets

from .models import MedicationSchedule, Medicine
from .serializers import MedicationScheduleSerializer, MedicineSerializer


class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer

    def get_queryset(self):
        qs = Medicine.objects.all()
        profile_id = self.request.query_params.get("profile_id")
        if profile_id:
            qs = qs.filter(patient_profile_id=profile_id)
        return qs


class MedicationScheduleViewSet(viewsets.ModelViewSet):
    queryset = MedicationSchedule.objects.all()
    serializer_class = MedicationScheduleSerializer

    def get_queryset(self):
        qs = MedicationSchedule.objects.all()
        profile_id = self.request.query_params.get("profile_id")
        if profile_id:
            qs = qs.filter(patient_profile_id=profile_id)
        return qs
