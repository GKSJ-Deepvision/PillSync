from datetime import datetime

from sqlalchemy.orm import Session

from app.models.notification import Notification


SUPPORTED_CHANNELS = {
    "push",
    "email",
    "sms",
}


def create_notification(
    db: Session,
    patient_id: int,
    reminder_id: int | None,
    channel: str,
    title: str,
    message: str,
) -> Notification:
    """
    Create a notification record.

    This development implementation stores the notification
    in the database. Actual FCM, email, and SMS delivery
    will be connected later.
    """

    normalized_channel = channel.strip().lower()

    if normalized_channel not in SUPPORTED_CHANNELS:
        raise ValueError(
            f"Unsupported notification channel: {channel}"
        )

    notification = Notification(
        patient_id=patient_id,
        reminder_id=reminder_id,
        channel=normalized_channel,
        title=title,
        message=message,
        status="pending",
    )

    db.add(notification)
    db.flush()

    return notification


def mark_notification_sent(
    db: Session,
    notification: Notification,
) -> Notification:
    """
    Mark a notification as successfully sent.
    """

    notification.status = "sent"
    notification.sent_at = datetime.utcnow()

    db.flush()

    return notification


def mark_notification_failed(
    db: Session,
    notification: Notification,
) -> Notification:
    """
    Mark a notification as failed.
    """

    notification.status = "failed"

    db.flush()

    return notification