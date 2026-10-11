from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import EmergencyContact, MedicalCondition, PatientProfile
from .serializers import (
    EmergencyContactSerializer,
    MedicalConditionSerializer,
    PatientProfileSerializer,
)


class PatientProfileViewSet(viewsets.ModelViewSet):
    queryset = PatientProfile.objects.all()
    serializer_class = PatientProfileSerializer

    def get_queryset(self):
        if self.request.user and self.request.user.is_authenticated:
            return self.request.user.accessible_patient_profiles()
        return PatientProfile.objects.all()

    def perform_create(self, serializer):
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()

    @action(detail=True, methods=["post"])
    def set_primary(self, request, pk=None):
        profile = self.get_object()
        if profile.user:
            PatientProfile.objects.filter(user=profile.user).update(is_primary=False)
        profile.is_primary = True
        profile.save()
        return Response(PatientProfileSerializer(profile).data)

    @action(detail=False, methods=["get"])
    def family(self, request):
        qs = self.get_queryset()
        return Response(PatientProfileSerializer(qs, many=True).data)


class MedicalConditionViewSet(viewsets.ModelViewSet):
    queryset = MedicalCondition.objects.all()
    serializer_class = MedicalConditionSerializer

    def get_queryset(self):
        if self.request.user and self.request.user.is_authenticated:
            accessible = self.request.user.accessible_patient_profiles()
            return MedicalCondition.objects.filter(patient_profile__in=accessible)
        return MedicalCondition.objects.all()


class EmergencyContactViewSet(viewsets.ModelViewSet):
    queryset = EmergencyContact.objects.all()
    serializer_class = EmergencyContactSerializer

    def get_queryset(self):
        if self.request.user and self.request.user.is_authenticated:
            accessible = self.request.user.accessible_patient_profiles()
            return EmergencyContact.objects.filter(patient_profile__in=accessible)
        return EmergencyContact.objects.all()
