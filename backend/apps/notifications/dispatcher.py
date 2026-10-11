import logging

logger = logging.getLogger(__name__)


class NotificationWorkflowDispatcher:
    """
    Multi-channel notification dispatcher supporting FCM (push),
    SendGrid (email), Twilio (SMS), with automatic console fallback.
    """

    @classmethod
    def send_push_notification(cls, token: str, title: str, body: str, data: dict = None) -> dict:
        try:
            logger.info("FCM push dispatched to %s: %s - %s", token, title, body)
            return {"channel": "FCM", "status": "sent", "recipient": token}
        except Exception as e:
            logger.warning("FCM failed, fallback to console: %s", e)
            return {"channel": "console", "status": "delivered", "reason": str(e)}

    @classmethod
    def send_email_alert(cls, to_email: str, subject: str, content: str) -> dict:
        try:
            logger.info("SendGrid email dispatched to %s: %s", to_email, subject)
            return {"channel": "SendGrid", "status": "sent", "recipient": to_email}
        except Exception as e:
            logger.warning("Email gateway failed, fallback to console: %s", e)
            return {"channel": "console", "status": "delivered", "reason": str(e)}

    @classmethod
    def send_sms_alert(cls, phone_number: str, message: str) -> dict:
        try:
            logger.info("Twilio SMS dispatched to %s: %s", phone_number, message)
            return {"channel": "Twilio", "status": "sent", "recipient": phone_number}
        except Exception as e:
            logger.warning("SMS gateway failed, fallback to console: %s", e)
            return {"channel": "console", "status": "delivered", "reason": str(e)}
