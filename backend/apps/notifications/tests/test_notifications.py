import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.notifications.models import Notification
from apps.notifications.services.dispatcher import NotificationDispatcher


@pytest.mark.django_db
class TestNotificationSystem:
    def setup_method(self):
        self.client = APIClient()
        self.dispatcher = NotificationDispatcher()

    def test_create_and_dispatch_notification(self):
        notif = self.dispatcher.create_notification(
            title="Refill Alert",
            message="Your Metformin supply is running low.",
            category="refill",
        )
        assert notif.title == "Refill Alert"
        assert notif.category == "refill"
        assert notif.is_read is False

    def test_notification_list_api(self):
        Notification.objects.create(
            title="Dose Alert", message="Take Lisinopril", category="reminder"
        )
        response = self.client.get("/api/notifications/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1
        assert data[0]["title"] == "Dose Alert"

    def test_mark_notification_read_api(self):
        notif = Notification.objects.create(
            title="Stock Alert", message="Low stock", category="low_stock"
        )
        response = self.client.post(f"/api/notifications/{notif.id}/read/")
        assert response.status_code == status.HTTP_200_OK

        notif.refresh_from_db()
        assert notif.is_read is True
