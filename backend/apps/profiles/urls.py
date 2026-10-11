from rest_framework.routers import DefaultRouter

from .views import EmergencyContactViewSet, MedicalConditionViewSet, PatientProfileViewSet

router = DefaultRouter()
router.register(r"conditions", MedicalConditionViewSet, basename="medical-conditions")
router.register(r"emergency-contacts", EmergencyContactViewSet, basename="emergency-contacts")
router.register(r"", PatientProfileViewSet, basename="patient-profile")

urlpatterns = router.urls
