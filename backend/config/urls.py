"""Root URL configuration.

Everything the SPA talks to lives under /api/v1/. The version is in the path so
a future breaking change can ship as /api/v2/ without stranding old clients.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from apps.common.views import health

api_v1 = [
    path("", include("apps.accounts.urls")),
    path("profiles/", include("apps.profiles.urls")),
    path("reference/", include("apps.common.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health, name="health"),
    path("api/v1/", include((api_v1, "v1"))),
    # Interactive API documentation - the Milestone 1 deliverable for docs/api.
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
