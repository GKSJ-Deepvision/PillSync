from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("apps.profiles.urls")),
    path("api/", include("apps.medications.api_urls")),
]
