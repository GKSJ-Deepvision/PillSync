from unittest import TestCase
from unittest.mock import patch

from apps.notifications.providers.fcm import FCMProvider


class FCMProviderTests(TestCase):
    @patch("apps.notifications.providers.fcm.messaging.send")
    @patch("apps.notifications.providers.fcm.messaging.Message")
    @patch("apps.notifications.providers.fcm.credentials.Certificate")
    @patch("apps.notifications.providers.fcm.firebase_admin.initialize_app")
    @patch("apps.notifications.providers.fcm.firebase_admin._apps", {})
    @patch(
        "apps.notifications.providers.fcm.settings.FIREBASE_CREDENTIALS_PATH",
        "test-credentials.json",
    )
    def test_send_calls_firebase(
        self,
        mock_initialize,
        mock_certificate,
        mock_message,
        mock_send,
    ):
        provider = FCMProvider()

        provider.send(
            message="Time to take your medicine.",
            recipient="test-device-token",
        )

        mock_certificate.assert_called_once_with("test-credentials.json")
        mock_initialize.assert_called_once()
        mock_message.assert_called_once()
        mock_send.assert_called_once()

    @patch(
        "apps.notifications.providers.fcm.settings.FIREBASE_CREDENTIALS_PATH",
        None,
    )
    def test_provider_requires_credentials_path(self):
        with self.assertRaises(RuntimeError):
            FCMProvider()
