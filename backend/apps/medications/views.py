from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import UserRole
from apps.medications.models import Medicine
from apps.medications.serializers import MedicineSerializer


@extend_schema(
    tags=["Medications"],
    summary="Manage medicines",
    description=(
        "Create, view, update, and delete medicines belonging to the " "authenticated patient."
    ),
)
class MedicineViewSet(viewsets.ModelViewSet):
    serializer_class = MedicineSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role != UserRole.PATIENT:
            return Medicine.objects.none()

        return Medicine.objects.filter(patient=user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)

    def create(self, request, *args, **kwargs):
        if request.user.role != UserRole.PATIENT:
            return Response(
                {"detail": "Only patients can create medicines."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().create(request, *args, **kwargs)
