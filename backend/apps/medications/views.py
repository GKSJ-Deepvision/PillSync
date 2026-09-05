"""Medicine and schedule endpoints."""

from __future__ import annotations

from django.db.models import Count, F
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.choices import MedicineCategory
from apps.common.permissions import IsProfileOwnerOrAssignedCaregiver

from .models import MedicationSchedule, Medicine
from .serializers import (
    MedicationScheduleSerializer,
    MedicineCreateSerializer,
    MedicineSerializer,
    RefillSerializer,
)


@extend_schema(tags=["medications"])
class MedicineViewSet(viewsets.ModelViewSet):
    """A patient's medicines.

    As everywhere else, the queryset is the access boundary: it only ever
    contains medicines belonging to profiles the caller may see.
    """

    queryset = Medicine.objects.none()
    serializer_class = MedicineSerializer
    permission_classes = [IsAuthenticated, IsProfileOwnerOrAssignedCaregiver]
    filterset_fields = ["patient", "category", "is_active", "prescription"]
    search_fields = ["name", "brand_name", "notes"]
    ordering_fields = ["name", "created_at", "quantity_remaining"]

    def get_queryset(self):
        return (
            Medicine.objects.filter(patient__in=self.request.user.accessible_patient_profiles())
            .select_related("patient", "reference", "prescription")
            .prefetch_related("schedules")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return MedicineCreateSerializer
        return MedicineSerializer

    def perform_destroy(self, instance: Medicine) -> None:
        # Stopping a medicine must not erase the doses already recorded
        # against it - that history is the adherence record.
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])

        from apps.reminders.services.generation import drop_future_events

        for schedule in instance.schedules.all():
            drop_future_events(schedule)

    @extend_schema(request=RefillSerializer, responses={200: MedicineSerializer})
    @action(detail=True, methods=["post"])
    def refill(self, request, pk=None):
        """Top the medicine back up after a pharmacy visit."""
        medicine = self.get_object()
        serializer = RefillSerializer(data=request.data, context={"medicine": medicine})
        serializer.is_valid(raise_exception=True)

        medicine.restock(serializer.validated_data["quantity"])
        return Response(MedicineSerializer(medicine, context=self.get_serializer_context()).data)

    @extend_schema(responses={200: None})
    @action(detail=False, methods=["get"], url_path="by-condition")
    def by_condition(self, request):
        """Medicines grouped by disease category.

        This is the specification's disease-based organisation: a patient with
        four conditions wants to see their diabetes medicines together, not one
        undifferentiated list of fourteen boxes.
        """
        queryset = self.filter_queryset(self.get_queryset()).filter(is_active=True)
        counts = {
            row["category"]: row["total"]
            for row in queryset.values("category").annotate(total=Count("id"))
        }

        groups = []
        for code, label in MedicineCategory.choices:
            if not counts.get(code):
                continue
            medicines = queryset.filter(category=code)
            groups.append(
                {
                    "code": code,
                    "label": label,
                    "count": counts[code],
                    "medicines": MedicineSerializer(
                        medicines, many=True, context=self.get_serializer_context()
                    ).data,
                }
            )
        return Response(groups)

    @extend_schema(responses={200: MedicineSerializer(many=True)})
    @action(detail=False, methods=["get"], url_path="low-stock")
    def low_stock(self, request):
        """Medicines at or below their low-stock threshold."""
        queryset = (
            self.filter_queryset(self.get_queryset())
            .filter(is_active=True)
            .filter(quantity_remaining__lte=F("low_stock_threshold"))
        )
        return Response(
            MedicineSerializer(queryset, many=True, context=self.get_serializer_context()).data
        )


@extend_schema(tags=["medications"])
class MedicationScheduleViewSet(viewsets.ModelViewSet):
    """Dosage schedules.

    Every write regenerates the affected future dose events, so a patient who
    moves their evening dose from 21:00 to 22:00 sees tomorrow's reminder at
    the new time rather than the old one.
    """

    queryset = MedicationSchedule.objects.none()
    serializer_class = MedicationScheduleSerializer
    permission_classes = [IsAuthenticated, IsProfileOwnerOrAssignedCaregiver]
    filterset_fields = ["medicine", "slot", "frequency", "is_active"]
    ordering_fields = ["time_of_day", "created_at"]

    def get_queryset(self):
        return MedicationSchedule.objects.filter(
            medicine__patient__in=self.request.user.accessible_patient_profiles()
        ).select_related("medicine", "medicine__patient")

    def perform_create(self, serializer):
        schedule = serializer.save()
        from apps.reminders.services.generation import generate_for_schedule

        generate_for_schedule(schedule)

    def perform_update(self, serializer):
        schedule = serializer.save()
        from apps.reminders.services.generation import regenerate_for_schedule

        regenerate_for_schedule(schedule)

    def perform_destroy(self, instance: MedicationSchedule) -> None:
        from apps.reminders.services.generation import drop_future_events

        drop_future_events(instance)
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])

    @extend_schema(responses={200: None})
    @action(detail=True, methods=["post"], url_path="regenerate")
    def regenerate(self, request, pk=None):
        """Rebuild this schedule's upcoming doses."""
        schedule = self.get_object()
        from apps.reminders.services.generation import regenerate_for_schedule

        dropped, created = regenerate_for_schedule(schedule)
        return Response({"dropped": dropped, "created": created}, status=status.HTTP_200_OK)
