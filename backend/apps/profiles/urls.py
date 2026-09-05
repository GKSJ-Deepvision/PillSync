"""Profile routes."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CaregiverProfileViewSet,
    EmergencyContactViewSet,
    PatientConditionViewSet,
    PatientProfileViewSet,
)

router = DefaultRouter()
router.register("patients", PatientProfileViewSet, basename="patient-profile")
router.register("caregivers", CaregiverProfileViewSet, basename="caregiver-profile")
router.register("emergency-contacts", EmergencyContactViewSet, basename="emergency-contact")
router.register("patient-conditions", PatientConditionViewSet, basename="patient-condition")

urlpatterns = [path("", include(router.urls))]
