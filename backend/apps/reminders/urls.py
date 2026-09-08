from rest_framework.routers import DefaultRouter

from .views import ReminderViewSet

router = DefaultRouter()
router.register(r"", ReminderViewSet, basename="reminder")

urlpatterns = router.urls
