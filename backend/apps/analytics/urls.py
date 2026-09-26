from rest_framework.routers import DefaultRouter

from .views import AdherenceAnalyticsViewSet

router = DefaultRouter()
router.register(r"", AdherenceAnalyticsViewSet, basename="adherence-analytics")

urlpatterns = router.urls
