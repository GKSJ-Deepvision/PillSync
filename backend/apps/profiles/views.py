from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import PatientProfile
from .serializers import PatientProfileSerializer


class PatientProfileViewSet(viewsets.ModelViewSet):
    queryset = PatientProfile.objects.all()
    serializer_class = PatientProfileSerializer

    def get_queryset(self):
        qs = PatientProfile.objects.all()
        if self.request.user and self.request.user.is_authenticated:
            return qs.filter(user=self.request.user)
        return qs

    def perform_create(self, serializer):
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()

    @action(detail=True, methods=["post"])
    def set_primary(self, request, pk=None):
        profile = self.get_object()
        PatientProfile.objects.filter(user=profile.user).update(is_primary=False)
        profile.is_primary = True
        profile.save()
        return Response(PatientProfileSerializer(profile).data)
