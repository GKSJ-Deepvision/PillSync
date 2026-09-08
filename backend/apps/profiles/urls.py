from rest_framework.routers import DefaultRouter

from .views import PatientProfileViewSet

router = DefaultRouter()
router.register(r"", PatientProfileViewSet, basename="patient-profile")

urlpatterns = router.urls
