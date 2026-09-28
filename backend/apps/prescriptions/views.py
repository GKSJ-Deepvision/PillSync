from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.api.serializers import PrescriptionSerializer
from apps.prescriptions.models import Prescription


class PrescriptionListCreateView(generics.ListCreateAPIView):
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Prescription.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
