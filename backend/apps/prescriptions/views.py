from rest_framework import viewsets

from .models import Prescription
from .serializers import PrescriptionSerializer


class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer

    def get_queryset(self):
        if self.request.user and self.request.user.is_authenticated:
            accessible = self.request.user.accessible_patient_profiles()
            return Prescription.objects.filter(patient_profile__in=accessible)
        return Prescription.objects.all()
