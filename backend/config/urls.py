from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("auth/", include("apps.accounts.urls")),
    path("notifications/", include("apps.notifications.urls")),
    path("api/profiles/", include("apps.profiles.urls")),
    path("api/medications/", include("apps.medications.urls")),
    path("api/reminders/", include("apps.reminders.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]
