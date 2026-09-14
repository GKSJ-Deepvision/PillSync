from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Dosage, MedicationSchedule
from .serializers import DosageSerializer, MedicationScheduleSerializer


class DosageListCreateView(generics.ListCreateAPIView):
    serializer_class = DosageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Dosage.objects.filter(medicine__user=self.request.user).select_related("medicine")

    def perform_create(self, serializer):
        medicine = serializer.validated_data["medicine"]

        if medicine.user_id != self.request.user.id:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("You do not have permission to use this medicine.")

        serializer.save()


class MedicationScheduleListCreateView(generics.ListCreateAPIView):
    serializer_class = MedicationScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MedicationSchedule.objects.filter(
            dosage__medicine__user=self.request.user
        ).select_related("dosage", "dosage__medicine")

    def perform_create(self, serializer):
        dosage = serializer.validated_data["dosage"]

        if dosage.medicine.user_id != self.request.user.id:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("You do not have permission to use this dosage.")

        serializer.save()
