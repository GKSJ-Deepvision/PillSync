from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

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

    @action(detail=False, methods=["get"], url_path="by-condition")
    def by_condition(self, request):
        qs = self.get_queryset()
        grouped = {}
        for med in qs:
            cat = med.category or "Other"
            if cat not in grouped:
                grouped[cat] = []
            grouped[cat].append(MedicineSerializer(med).data)
        return Response(grouped)


class MedicationScheduleViewSet(viewsets.ModelViewSet):
    queryset = MedicationSchedule.objects.all()
    serializer_class = MedicationScheduleSerializer

    def get_queryset(self):
        qs = MedicationSchedule.objects.all()
        profile_id = self.request.query_params.get("profile_id")
        if profile_id:
            qs = qs.filter(patient_profile_id=profile_id)
        return qs
