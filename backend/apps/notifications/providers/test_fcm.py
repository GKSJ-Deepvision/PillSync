from unittest import TestCase
from unittest.mock import patch

from apps.notifications.providers.fcm import FCMProvider


class FCMProviderTests(TestCase):
    @patch.dict("os.environ", {}, clear=True)
    def test_send_requires_fcm_server_key(self):
        provider = FCMProvider()

        with self.assertRaises(RuntimeError):
            provider.send(
                message="Time to take your medicine.",
                recipient="test-device-token",
            )

    @patch.dict("os.environ", {"FCM_SERVER_KEY": "test-key"})
    def test_send_requires_actual_delivery_implementation(self):
        provider = FCMProvider()

        with self.assertRaises(NotImplementedError):
            provider.send(
                message="Time to take your medicine.",
                recipient="test-device-token",
            )
