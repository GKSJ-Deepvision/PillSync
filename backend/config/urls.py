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
            },
        }
    )


urlpatterns = [
    path("", api_root, name="api-root"),
    path("api/", api_root, name="api-root-prefix"),
    path("admin/", admin.site.urls),
    path("api/accounts/", include("apps.accounts.urls")),
    path("api/profiles/", include("apps.profiles.urls")),
    path("api/medications/", include("apps.medications.urls")),
    path("api/reminders/", include("apps.reminders.urls")),
    path("api/adherence/", include("apps.adherence.urls")),
]
