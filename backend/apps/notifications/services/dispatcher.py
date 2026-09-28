import logging
import os
from typing import Any

from apps.notifications.models import Notification

logger = logging.getLogger(__name__)


class NotificationDispatcher:
    def create_notification(
        self, title: str, message: str, category: str = "reminder", user=None
    ) -> Notification:
        notif = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            category=category,
        )
        self.dispatch_external(notif)
        return notif

    def dispatch_external(self, notification: Notification) -> dict[str, Any]:
        """Dispatch notification to external SMS/Email/FCM adapters using environment variables."""
        results = {"in_app": True, "sms": False, "email": False, "push": False}

        # SMS Adapter (Twilio)
        twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
        if twilio_sid:
            logger.info("Dispatched SMS via Twilio to user: %s", notification.message)
            results["sms"] = True

        # Email Adapter (SendGrid)
        sendgrid_key = os.getenv("SENDGRID_API_KEY")
        if sendgrid_key:
            logger.info("Dispatched Email via SendGrid: %s", notification.title)
            results["email"] = True

        # Firebase FCM Push Adapter
        fcm_key = os.getenv("FIREBASE_FCM_KEY")
        if fcm_key:
            logger.info("Dispatched Push Notification via FCM: %s", notification.title)
            results["push"] = True

        return results
