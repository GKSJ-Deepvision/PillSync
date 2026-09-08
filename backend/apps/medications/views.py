from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Medication
from .serializers import MedicationScheduleSerializer, MedicationSerializer


class OwnerQuerysetMixin:
    def owned_queryset(self, queryset):
        if self.request.user.is_authenticated:
            return queryset.filter(owner=self.request.user)
        return queryset.filter(owner__isnull=True)


class MedicationViewSet(OwnerQuerysetMixin, viewsets.ModelViewSet):
    serializer_class = MedicationSerializer

    def get_queryset(self):
        return self.owned_queryset(Medication.objects.prefetch_related("schedules"))

    def perform_create(self, serializer):
        owner = self.request.user if self.request.user.is_authenticated else None
        serializer.save(owner=owner)


class MedicationScheduleListCreateView(OwnerQuerysetMixin, APIView):
    def get_medication(self, medication_id):
        return get_object_or_404(self.owned_queryset(Medication.objects), pk=medication_id)

    def get(self, request, medication_id):
        medication = self.get_medication(medication_id)
        serializer = MedicationScheduleSerializer(medication.schedules.all(), many=True)
        return Response(serializer.data)

    def post(self, request, medication_id):
        medication = self.get_medication(medication_id)
        serializer = MedicationScheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(medication=medication)
        return Response(serializer.data, status=201)
