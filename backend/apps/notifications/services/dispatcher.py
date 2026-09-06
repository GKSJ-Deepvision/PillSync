from apps.notifications.models import DeviceToken
from apps.notifications.providers.fcm import send_push_notification


def send_user_notification(user, title, body):
    tokens = DeviceToken.objects.filter(
        user=user,
        is_active=True,
    )

    results = []

    for device in tokens:
        try:
            result = send_push_notification(
                device.token,
                title,
                body,
            )
            results.append(result)
        except Exception:
            device.is_active = False
            device.save(update_fields=["is_active"])

    return results
