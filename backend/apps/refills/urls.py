from rest_framework.routers import DefaultRouter

from .views import RefillPredictionViewSet, RefillRequestViewSet

router = DefaultRouter()
router.register(r"predictions", RefillPredictionViewSet, basename="refill-prediction")
router.register(r"requests", RefillRequestViewSet, basename="refill-request")

urlpatterns = router.urls
