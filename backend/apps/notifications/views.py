"""Notification preference, device registration and delivery-log endpoints."""

from __future__ import annotations

from django.db.models import Count, Q
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.choices import NotificationStatus

from .models import DeviceToken, NotificationLog
from .serializers import (
    DeviceTokenSerializer,
    NotificationLogSerializer,
    NotificationPreferenceSerializer,
)
from .services.dispatcher import preferences_for


@extend_schema(tags=["notifications"])
class NotificationPreferenceView(RetrieveUpdateAPIView):
    """The signed-in user's delivery settings."""

    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return preferences_for(self.request.user)


@extend_schema(tags=["notifications"])
class DeviceTokenViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Firebase Cloud Messaging registrations for this user's devices."""

    queryset = DeviceToken.objects.none()
    serializer_class = DeviceTokenSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DeviceToken.objects.filter(user=self.request.user, is_active=True)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # FCM hands the same token back on every page load, and reissues it to
        # a different user when a shared device changes hands. Re-registering
        # therefore reassigns rather than erroring on the unique constraint.
        token, created = DeviceToken.objects.update_or_create(
            token=serializer.validated_data["token"],
            defaults={
                "user": request.user,
                "platform": serializer.validated_data.get("platform", "WEB"),
                "device_name": serializer.validated_data.get("device_name", ""),
                "is_active": True,
            },
        )
        return Response(
            DeviceTokenSerializer(token).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def perform_destroy(self, instance: DeviceToken) -> None:
        instance.deactivate()


@extend_schema(tags=["notifications"])
class NotificationLogViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """What the platform sent this user, and whether it arrived."""

    queryset = NotificationLog.objects.none()
    serializer_class = NotificationLogSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["category", "channel", "status"]
    ordering_fields = ["created_at", "sent_at"]

    def get_queryset(self):
        return NotificationLog.objects.filter(recipient=self.request.user)

    @extend_schema(responses={200: None})
    @action(detail=False, methods=["get"])
    def delivery_stats(self, request):
        """Delivery success rate — a graded performance metric in Milestone 4."""
        counts = self.get_queryset().aggregate(
            total=Count("id"),
            sent=Count("id", filter=Q(status=NotificationStatus.SENT)),
            failed=Count("id", filter=Q(status=NotificationStatus.FAILED)),
            skipped=Count("id", filter=Q(status=NotificationStatus.SKIPPED)),
        )
        attempted = counts["sent"] + counts["failed"]
        counts["success_rate_percent"] = (
            round(counts["sent"] / attempted * 100, 1) if attempted else 0.0
        )
        return Response(counts)
