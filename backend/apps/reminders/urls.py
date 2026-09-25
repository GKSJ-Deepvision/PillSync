from django.urls import path

from .views import ReminderActionView, ReminderListCreateView

urlpatterns = [
    path("", ReminderListCreateView.as_view(), name="reminder-list-create"),
    path("<int:pk>/action/", ReminderActionView.as_view(), name="reminder-action"),
]