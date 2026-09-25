from apps.notifications.models import DeviceToken
from apps.notifications.services.fcm import send_push_notification


def send_refill_notification(
    user,
    medicine_name: str,
    remaining_stock: int,
    days_remaining: float,
):
    """Send refill alert notification to all active user devices."""

    title = "Medicine Refill Alert"

    body = (
        f"Your {medicine_name} has only "
        f"{remaining_stock} units remaining. "
        f"Your medicine may last for approximately "
        f"{days_remaining} days. Please arrange a refill."
    )

    device_tokens = DeviceToken.objects.filter(
        user=user,
        is_active=True,
    )

    results = []

    for device in device_tokens:
        try:
            response = send_push_notification(
                device_token=device.token,
                title=title,
                body=body,
                data={
                    "type": "REFILL_ALERT",
                    "medicine_name": medicine_name,
                    "remaining_stock": str(remaining_stock),
                    "days_remaining": str(days_remaining),
                },
            )

            results.append(
                {
                    "device_token": device.token,
                    "success": True,
                    "response": response,
                }
            )

        except Exception as exc:
            results.append(
                {
                    "device_token": device.token,
                    "success": False,
                    "error": str(exc),
                }
            )

    return results