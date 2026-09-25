from firebase_admin import messaging

from config.firebase.admin import initialize_firebase


def send_push_notification(
    device_token: str,
    title: str,
    body: str,
    data: dict | None = None,
):
    initialize_firebase()

    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        token=device_token,
        data=data or {},
    )

    return messaging.send(message)