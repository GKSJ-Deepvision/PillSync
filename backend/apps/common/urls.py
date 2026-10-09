"""Reference data routes."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MedicalConditionViewSet, MedicineReferenceViewSet, category_summary, enums

router = DefaultRouter()
router.register("conditions", MedicalConditionViewSet, basename="condition")
router.register("medicines", MedicineReferenceViewSet, basename="medicine-reference")

urlpatterns = [
    path("categories/", category_summary, name="category-summary"),
    path("enums/", enums, name="enums"),
    path("", include(router.urls)),
]
