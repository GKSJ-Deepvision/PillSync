"""Profile, condition and emergency-contact endpoints."""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsProfileOwnerOrAssignedCaregiver

from .models import CaregiverProfile, EmergencyContact, PatientCondition, PatientProfile
from .serializers import (
    CaregiverProfileSerializer,
    EmergencyContactSerializer,
    PatientConditionSerializer,
    PatientProfileCreateSerializer,
    PatientProfileSerializer,
)


@extend_schema(tags=["profiles"])
class PatientProfileViewSet(viewsets.ModelViewSet):
    """Patient profiles, including the family profiles a user manages.

    The queryset is the access-control boundary: it returns only the profiles
    the caller may see, so no endpoint on this viewset can leak another
    patient's record even if a permission check were forgotten.
    """

    # get_queryset() is the real access boundary; this empty queryset only
    # tells the schema generator which model the viewset serves.
    queryset = PatientProfile.objects.none()
    serializer_class = PatientProfileSerializer
    permission_classes = [IsAuthenticated, IsProfileOwnerOrAssignedCaregiver]
    filterset_fields = ["is_self", "is_active", "gender"]
    search_fields = ["full_name"]
    ordering_fields = ["full_name", "created_at"]

    def get_queryset(self):
        return (
            self.request.user.accessible_patient_profiles()
            .select_related("user", "managed_by")
            .prefetch_related("emergency_contacts", "patient_conditions__condition")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return PatientProfileCreateSerializer
        return PatientProfileSerializer

    def perform_destroy(self, instance: PatientProfile) -> None:
        # Medication history hangs off a profile from Milestone 2 onward, so a
        # profile is retired rather than deleted.
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])

    @extend_schema(responses={200: PatientProfileSerializer})
    @action(detail=False, methods=["get"])
    def me(self, request):
        """The signed-in user's own profile."""
        profile = PatientProfile.objects.filter(user=request.user).first()
        if profile is None:
            return Response(
                {"detail": "You do not have a patient profile. Create one first."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(PatientProfileSerializer(profile).data)


@extend_schema(tags=["profiles"])
class EmergencyContactViewSet(viewsets.ModelViewSet):
    queryset = EmergencyContact.objects.none()
    serializer_class = EmergencyContactSerializer
    permission_classes = [IsAuthenticated, IsProfileOwnerOrAssignedCaregiver]
    filterset_fields = ["patient", "is_primary"]

    def get_queryset(self):
        return EmergencyContact.objects.filter(
            patient__in=self.request.user.accessible_patient_profiles()
        ).select_related("patient")


@extend_schema(tags=["profiles"])
class PatientConditionViewSet(viewsets.ModelViewSet):
    queryset = PatientCondition.objects.none()
    serializer_class = PatientConditionSerializer
    permission_classes = [IsAuthenticated, IsProfileOwnerOrAssignedCaregiver]
    filterset_fields = ["patient", "is_active", "severity", "condition__category"]

    def get_queryset(self):
        return PatientCondition.objects.filter(
            patient__in=self.request.user.accessible_patient_profiles()
        ).select_related("patient", "condition")


@extend_schema(tags=["profiles"])
class CaregiverProfileViewSet(viewsets.ModelViewSet):
    """A caregiver's own professional details."""

    queryset = CaregiverProfile.objects.none()
    serializer_class = CaregiverProfileSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        base = CaregiverProfile.objects.select_related("user")
        if user.is_admin:
            return base
        return base.filter(user=user)

    @extend_schema(responses={200: CaregiverProfileSerializer})
    @action(detail=False, methods=["get"])
    def me(self, request):
        profile = CaregiverProfile.objects.filter(user=request.user).first()
        if profile is None:
            return Response(
                {"detail": "You do not have a caregiver profile."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(CaregiverProfileSerializer(profile).data)
