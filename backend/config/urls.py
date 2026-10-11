from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def api_root(request):
    return JsonResponse(
        {
            "name": "PillSync API Server",
            "version": "1.0.0",
            "status": "running",
            "endpoints": {
                "admin": "/admin/",
                "accounts": "/api/accounts/",
                "profiles": "/api/profiles/",
                "medications": "/api/medications/",
                "reminders": "/api/reminders/",
                "adherence": "/api/adherence/",
                "refills": "/api/refills/",
                "analytics": "/api/analytics/",
                "ocr": "/api/ocr/",
                "notifications": "/api/notifications/",
                "prescriptions": "/api/prescriptions/",
            },
        }
    )


urlpatterns = [
    path("", api_root, name="api-root"),
    path("api/", api_root, name="api-root-prefix"),
    path("api/v1/", api_root, name="api-v1-root"),
    path("admin/", admin.site.urls),
    path("api/accounts/", include("apps.accounts.urls")),
    path("api/profiles/", include("apps.profiles.urls")),
    path("api/medications/", include("apps.medications.urls")),
    path("api/prescriptions/", include("apps.prescriptions.urls")),
    path("api/reminders/", include("apps.reminders.urls")),
    path("api/adherence/", include("apps.adherence.urls")),
    path("api/refills/", include("apps.refills.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/ocr/", include("apps.ocr.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    # v1 API namespace aliases
    path("api/v1/accounts/", include("apps.accounts.urls")),
    path("api/v1/profiles/", include("apps.profiles.urls")),
    path("api/v1/medicines/", include("apps.medications.urls")),
    path("api/v1/medications/", include("apps.medications.urls")),
    path("api/v1/prescriptions/", include("apps.prescriptions.urls")),
    path("api/v1/reminders/", include("apps.reminders.urls")),
    path("api/v1/doses/", include("apps.adherence.urls")),
    path("api/v1/adherence/", include("apps.adherence.urls")),
    path("api/v1/refills/", include("apps.refills.urls")),
    path("api/v1/analytics/", include("apps.analytics.urls")),
    path("api/v1/ocr/", include("apps.ocr.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
]
