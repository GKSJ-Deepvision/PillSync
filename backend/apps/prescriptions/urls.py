"""Prescription routes."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PrescriptionViewSet

router = DefaultRouter()
router.register("prescriptions", PrescriptionViewSet, basename="prescription")

urlpatterns = [path("", include(router.urls))]
