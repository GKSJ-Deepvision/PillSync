from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/accounts/", include("apps.accounts.urls")),
    path("api/reminders/", include("apps.reminders.urls")),
    path("api/refills/", include("apps.refills.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
]