"""URL configuration for PillSync project."""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/medications/", include("apps.medications.urls")),
    path("api/medication-history/", include("apps.medications.history_urls")),
    path("api/reminders/", include("apps.reminders.urls")),
    path("api/adherence/", include("apps.adherence.urls")),
]
