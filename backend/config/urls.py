from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("api/health/", health_check, name="health-check"),
    path("api/medications/", include("apps.medications.urls")),
    path("api/adherence/", include("apps.adherence.urls")),
]
