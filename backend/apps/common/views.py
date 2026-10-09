"""Read-only reference data the frontend needs to render its forms."""

from __future__ import annotations

from django.db.models import Count
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .choices import (
    AssignmentStatus,
    BloodGroup,
    CaregiverRelationship,
    ConditionSeverity,
    Gender,
    MedicineCategory,
    UserRole,
)
from .models import MedicalCondition, MedicineReference
from .pagination import LargePagination
from .serializers import (
    CategorySummarySerializer,
    EnumsSerializer,
    HealthSerializer,
    MedicalConditionSerializer,
    MedicineReferenceSerializer,
)


@extend_schema(tags=["reference"])
class MedicalConditionViewSet(viewsets.ReadOnlyModelViewSet):
    """The conditions a patient profile can record."""

    queryset = MedicalCondition.objects.filter(is_active=True)
    serializer_class = MedicalConditionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = LargePagination
    filterset_fields = ["category", "is_chronic"]
    search_fields = ["name", "code"]
    ordering_fields = ["name", "category"]


@extend_schema(tags=["reference"])
class MedicineReferenceViewSet(viewsets.ReadOnlyModelViewSet):
    """The medicine catalogue, seeded from the FDA National Drug Code Directory.

    Search here backs medicine entry in Milestone 2 and gives the OCR pipeline
    in Milestone 3 an authoritative list to match extracted names against.
    """

    queryset = MedicineReference.objects.filter(is_active=True)
    serializer_class = MedicineReferenceSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["category", "requires_prescription", "dosage_form"]
    search_fields = ["generic_name", "brand_name", "pharm_class"]
    ordering_fields = ["generic_name", "category"]


@extend_schema(tags=["reference"], responses={200: CategorySummarySerializer(many=True)})
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def category_summary(request):
    """How many catalogue entries sit in each disease category."""
    counts = {
        row["category"]: row["total"]
        for row in MedicineReference.objects.filter(is_active=True)
        .values("category")
        .annotate(total=Count("id"))
    }
    return Response(
        [
            {"code": code, "label": label, "medicine_count": counts.get(code, 0)}
            for code, label in MedicineCategory.choices
        ]
    )


@extend_schema(tags=["reference"], responses={200: EnumsSerializer})
@api_view(["GET"])
@permission_classes([AllowAny])
def enums(request):
    """Every choice list in one call.

    The frontend renders its dropdowns from this rather than hardcoding option
    lists that then drift away from the backend's validation.
    """

    def as_options(choices):
        return [{"value": value, "label": label} for value, label in choices]

    return Response(
        {
            "roles": as_options(UserRole.choices),
            "genders": as_options(Gender.choices),
            "blood_groups": as_options(BloodGroup.choices),
            "medicine_categories": as_options(MedicineCategory.choices),
            "caregiver_relationships": as_options(CaregiverRelationship.choices),
            "assignment_statuses": as_options(AssignmentStatus.choices),
            "condition_severities": as_options(ConditionSeverity.choices),
        }
    )


@extend_schema(tags=["reference"], responses={200: HealthSerializer})
@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    """Liveness probe for the load balancer and the deployment pipeline."""
    return Response({"status": "ok", "service": "pillsync-api", "version": "0.1.0"})
