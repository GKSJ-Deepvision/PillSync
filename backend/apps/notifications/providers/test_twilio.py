from unittest import TestCase
from unittest.mock import patch

from apps.notifications.providers.twilio import TwilioProvider


class TwilioProviderTests(TestCase):
    @patch.dict(
        "os.environ",
        {
            "TWILIO_ACCOUNT_SID": "test-sid",
            "TWILIO_AUTH_TOKEN": "test-token",
            "TWILIO_FROM_NUMBER": "+10000000000",
        },
    )
    @patch("apps.notifications.providers.twilio.Client")
    def test_send_calls_twilio(self, mock_client):
        provider = TwilioProvider()

        provider.send(
            message="Time to take your medicine.",
            recipient="+911234567890",
        )

        mock_client.assert_called_once_with(
            "test-sid",
            "test-token",
        )
        mock_client.return_value.messages.create.assert_called_once_with(
            body="Time to take your medicine.",
            from_="+10000000000",
            to="+911234567890",
        )

    @patch.dict("os.environ", {}, clear=True)
    def test_provider_requires_account_sid(self):
        provider = TwilioProvider()

        with self.assertRaises(RuntimeError):
            provider.send(
                message="Time to take your medicine.",
                recipient="+911234567890",
            )

    @patch.dict(
        "os.environ",
        {"TWILIO_ACCOUNT_SID": "test-sid"},
        clear=True,
    )
    def test_provider_requires_auth_token(self):
        provider = TwilioProvider()

        with self.assertRaises(RuntimeError):
            provider.send(
                message="Time to take your medicine.",
                recipient="+911234567890",
            )

    @patch.dict(
        "os.environ",
        {
            "TWILIO_ACCOUNT_SID": "test-sid",
            "TWILIO_AUTH_TOKEN": "test-token",
        },
        clear=True,
    )
    def test_provider_requires_from_number(self):
        provider = TwilioProvider()

        with self.assertRaises(RuntimeError):
            provider.send(
                message="Time to take your medicine.",
                recipient="+911234567890",
            )
