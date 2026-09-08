from django.urls import path
from .views import reminder_list_create, update_reminder_status

urlpatterns = [
    path("", reminder_list_create, name="reminder-list-create"),
    path("<int:pk>/status/", update_reminder_status, name="update-reminder-status"),
]
