"""Reminder and medication-history endpoints."""

from __future__ import annotations

from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.choices import DoseSlot, DoseStatus
from apps.common.permissions import IsProfileOwnerOrAssignedCaregiver

from .models import DoseEvent
from .serializers import (
    DoseEventSerializer,
    SnoozeSerializer,
    TakeDoseSerializer,
)
from .services import actions

#: How much history a single request may ask for. A year of doses for a patient
#: on six medicines is thousands of rows; the summary endpoints are the right
#: tool for long ranges.
MAX_HISTORY_DAYS = 92


def _summarise(queryset) -> dict:
    counts = queryset.aggregate(
        total=Count("id"),
        taken=Count("id", filter=Q(status=DoseStatus.TAKEN)),
        missed=Count("id", filter=Q(status=DoseStatus.MISSED)),
        skipped=Count("id", filter=Q(status=DoseStatus.SKIPPED)),
        pending=Count("id", filter=Q(status__in=[DoseStatus.PENDING, DoseStatus.SNOOZED])),
    )
    # Skipped doses are excluded from the denominator on purpose: a dose the
    # doctor told the patient to stop is not an adherence failure.
    resolved = counts["taken"] + counts["missed"]
    counts["adherence_percent"] = round(counts["taken"] / resolved * 100, 1) if resolved else 0.0
    return counts


@extend_schema(tags=["reminders"])
class DoseEventViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Scheduled doses: what is due, and what happened to what was due.

    Read-only apart from the four actions. A dose never changes state by having
    its fields written directly — every transition goes through the service
    layer, so stock decrements and caregiver alerts cannot be bypassed.
    """

    queryset = DoseEvent.objects.none()
    serializer_class = DoseEventSerializer
    permission_classes = [IsAuthenticated, IsProfileOwnerOrAssignedCaregiver]
    filterset_fields = ["patient", "medicine", "status", "slot"]
    ordering_fields = ["scheduled_for", "status"]

    def get_queryset(self):
        return DoseEvent.objects.filter(
            patient__in=self.request.user.accessible_patient_profiles()
        ).select_related("medicine", "patient", "schedule")

    # -- actions -----------------------------------------------------------

    @extend_schema(request=TakeDoseSerializer, responses={200: DoseEventSerializer})
    @action(detail=True, methods=["post"])
    def take(self, request, pk=None):
        """Record the dose as taken and decrement stock."""
        dose = self.get_object()
        serializer = TakeDoseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        actions.mark_taken(
            dose,
            quantity=serializer.validated_data.get("quantity_taken"),
            notes=serializer.validated_data.get("notes", ""),
        )
        return Response(self.get_serializer(dose).data)

    @extend_schema(request=None, responses={200: DoseEventSerializer})
    @action(detail=True, methods=["post"])
    def miss(self, request, pk=None):
        """Record the dose as missed. Caregivers who opted in are alerted."""
        dose = self.get_object()
        actions.mark_missed(dose, notes=request.data.get("notes", ""))
        return Response(self.get_serializer(dose).data)

    @extend_schema(request=None, responses={200: DoseEventSerializer})
    @action(detail=True, methods=["post"])
    def skip(self, request, pk=None):
        """Deliberately skip a dose — not counted as an adherence failure."""
        dose = self.get_object()
        actions.mark_skipped(dose, notes=request.data.get("notes", ""))
        return Response(self.get_serializer(dose).data)

    @extend_schema(request=SnoozeSerializer, responses={200: DoseEventSerializer})
    @action(detail=True, methods=["post"])
    def snooze(self, request, pk=None):
        """Postpone the reminder."""
        dose = self.get_object()
        serializer = SnoozeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        actions.snooze(dose, minutes=serializer.validated_data["minutes"])
        return Response(self.get_serializer(dose).data)

    # -- views over the data ----------------------------------------------

    @extend_schema(
        parameters=[
            OpenApiParameter("patient", str, description="Limit to one patient profile."),
            OpenApiParameter("date", str, description="ISO date. Defaults to today."),
        ],
        responses={200: None},
    )
    @action(detail=False, methods=["get"])
    def today(self, request):
        """Today's doses, grouped into morning / afternoon / evening / night."""
        day = timezone.localdate()
        if raw := request.query_params.get("date"):
            from django.utils.dateparse import parse_date

            day = parse_date(raw) or day

        queryset = self.filter_queryset(self.get_queryset()).on_day(day)
        grouped = {slot: [] for slot, _label in DoseSlot.choices}
        for dose in queryset.order_by("scheduled_for"):
            grouped[dose.slot].append(self.get_serializer(dose).data)

        return Response(
            {
                "date": day,
                "slots": grouped,
                "summary": {"date": day, **_summarise(queryset)},
            }
        )

    @extend_schema(
        parameters=[
            OpenApiParameter("patient", str, description="Limit to one patient profile."),
            OpenApiParameter("days", int, description="How many days ahead. Default 7."),
        ],
        responses={200: DoseEventSerializer(many=True)},
    )
    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        """Doses still to come."""
        days = min(int(request.query_params.get("days", 7) or 7), 30)
        now = timezone.now()

        queryset = (
            self.filter_queryset(self.get_queryset())
            .pending()
            .filter(scheduled_for__gte=now, scheduled_for__lte=now + timedelta(days=days))
            .order_by("scheduled_for")
        )
        return Response(self.get_serializer(queryset, many=True).data)

    @extend_schema(
        parameters=[
            OpenApiParameter("patient", str, description="Limit to one patient profile."),
            OpenApiParameter("days", int, description=f"Look back N days, max {MAX_HISTORY_DAYS}."),
        ],
        responses={200: None},
    )
    @action(detail=False, methods=["get"])
    def history(self, request):
        """Medication history: one row per day, with the doses of each.

        This is the Milestone 2 deliverable that Milestone 3's adherence
        analytics builds on — the daily counts here are exactly what the
        percentage, streak and trend calculations will aggregate.
        """
        days = min(int(request.query_params.get("days", 14) or 14), MAX_HISTORY_DAYS)
        today = timezone.localdate()
        start = today - timedelta(days=days - 1)

        queryset = (
            self.filter_queryset(self.get_queryset())
            .filter(scheduled_for__date__gte=start, scheduled_for__date__lte=today)
            .order_by("-scheduled_for")
        )

        by_day: dict = {}
        for dose in queryset:
            key = timezone.localtime(dose.scheduled_for).date()
            by_day.setdefault(key, []).append(dose)

        entries = []
        for offset in range(days):
            day = today - timedelta(days=offset)
            doses = by_day.get(day, [])
            counts = {
                "total": len(doses),
                "taken": sum(1 for d in doses if d.status == DoseStatus.TAKEN),
                "missed": sum(1 for d in doses if d.status == DoseStatus.MISSED),
                "skipped": sum(1 for d in doses if d.status == DoseStatus.SKIPPED),
                "pending": sum(1 for d in doses if d.is_open),
            }
            resolved = counts["taken"] + counts["missed"]
            counts["adherence_percent"] = (
                round(counts["taken"] / resolved * 100, 1) if resolved else 0.0
            )
            entries.append(
                {
                    "date": day,
                    **counts,
                    "doses": self.get_serializer(doses, many=True).data,
                }
            )

        return Response(
            {
                "start_date": start,
                "end_date": today,
                "days": entries,
                "summary": {"date": today, **_summarise(queryset)},
            }
        )
