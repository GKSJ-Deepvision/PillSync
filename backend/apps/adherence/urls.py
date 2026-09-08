from rest_framework.routers import DefaultRouter

from .views import AdherenceLogViewSet

router = DefaultRouter()
router.register(r"", AdherenceLogViewSet, basename="adherence-log")

urlpatterns = router.urls
