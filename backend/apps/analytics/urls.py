from django.urls import path

from .views import analytics_overview

urlpatterns = [
    path("overview/", analytics_overview, name="analytics-overview"),
]
