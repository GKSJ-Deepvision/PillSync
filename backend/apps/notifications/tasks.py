from celery import shared_task
from django.utils import timezone

from .models import Notification
from .services.dispatcher import NotificationDispatcher


@shared_task(
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def send_notification(notification_id: int):
    """Send a notification through the configured provider."""
    notification = Notification.objects.get(id=notification_id)

    notification.attempts += 1

    try:
        NotificationDispatcher().send(notification)
    except Exception as exc:
        notification.status = Notification.Status.FAILED
        notification.last_error = str(exc)
        notification.save(
            update_fields=[
                "status",
                "attempts",
                "last_error",
                "updated_at",
            ]
        )
        raise

    notification.status = Notification.Status.SENT
    notification.sent_at = timezone.now()
    notification.last_error = ""
    notification.save(
        update_fields=[
            "status",
            "attempts",
            "sent_at",
            "last_error",
            "updated_at",
        ]
    )


@shared_task
def dispatch_pending_notifications():
    """Queue delivery tasks for pending notifications."""
    notifications = Notification.objects.filter(
        status=Notification.Status.PENDING,
    )

    for notification in notifications:
        send_notification.delay(notification.id)

    return notifications.count()
