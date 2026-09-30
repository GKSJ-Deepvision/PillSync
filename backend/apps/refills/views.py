"""Refill endpoints."""

from __future__ import annotations

from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsProfileOwnerOrAssignedCaregiver

from .engine import STATUS_LEVEL
from .models import RefillPrediction
from .serializers import RefillPredictionSerializer
from .services import backtest, prediction


@extend_schema(tags=["refills"])
class RefillPredictionViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """Refill forecasts for every medicine the caller can see, most urgent first."""

    queryset = RefillPrediction.objects.none()
    serializer_class = RefillPredictionSerializer
    permission_classes = [IsAuthenticated, IsProfileOwnerOrAssignedCaregiver]
    filterset_fields = ["patient", "status", "medicine"]
    pagination_class = None

    def get_queryset(self):
        return RefillPrediction.objects.filter(
            patient__in=self.request.user.accessible_patient_profiles(),
            medicine__is_active=True,
        ).select_related("medicine", "patient")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        today = timezone.localdate()
        # Worst first; medicines with no forecast last.
        rows = sorted(
            queryset,
            key=lambda p: (
                -STATUS_LEVEL.get(p.status, 0),
                p.depletion_date is None,
                p.depletion_date or today,
            ),
        )
        return Response(self.get_serializer(rows, many=True).data)

    @extend_schema(responses={200: None})
    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Counts by status - the badge on the dashboard."""
        queryset = self.filter_queryset(self.get_queryset())
        counts = dict.fromkeys(("OUT", "CRITICAL", "LOW", "OK", "COVERED", "UNKNOWN"), 0)
        for status_code in queryset.values_list("status", flat=True):
            counts[status_code] = counts.get(status_code, 0) + 1
        counts["needs_attention"] = counts["OUT"] + counts["CRITICAL"] + counts["LOW"]
        return Response(counts)

    @extend_schema(responses={200: None})
    @action(detail=True, methods=["get"])
    def projection(self, request, pk=None):
        """Day-by-day stock for the next 30 days - the data behind the chart."""
        obj = self.get_object()
        return Response(
            {
                "status": obj.status,
                "depletion_date": obj.depletion_date,
                "recommended_refill_date": obj.recommended_refill_date,
                "points": prediction.projection(obj, days=30),
            }
        )

    @extend_schema(request=None, responses={200: RefillPredictionSerializer(many=True)})
    @action(detail=False, methods=["post"])
    def recompute(self, request):
        """Recalculate now, without waiting for the nightly run."""
        ids = list(request.user.accessible_patient_profiles().values_list("id", flat=True))
        prediction.recompute_all(patient_ids=ids)
        return self.list(request)

    @extend_schema(responses={200: None})
    @action(detail=False, methods=["get"])
    def accuracy(self, request):
        """How well the consumption forecast matched what was really taken."""
        from apps.medications.models import Medicine

        medicines = Medicine.objects.filter(
            patient__in=request.user.accessible_patient_profiles(), is_active=True
        ).prefetch_related("schedules")
        return Response(backtest.consumption_backtest(medicines, timezone.localdate()))
