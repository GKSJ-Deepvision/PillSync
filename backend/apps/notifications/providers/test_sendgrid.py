from unittest import TestCase
from unittest.mock import patch

from apps.notifications.providers.sendgrid import SendGridProvider


class SendGridProviderTests(TestCase):
    @patch.dict(
        "os.environ",
        {
            "SENDGRID_API_KEY": "test-key",
            "SENDGRID_FROM_EMAIL": "noreply@example.com",
        },
    )
    @patch("apps.notifications.providers.sendgrid.SendGridAPIClient")
    def test_send_calls_sendgrid(self, mock_client):
        provider = SendGridProvider()

        provider.send(
            message="Time to take your medicine.",
            recipient="patient@example.com",
        )

        mock_client.assert_called_once_with("test-key")
        mock_client.return_value.send.assert_called_once()

    @patch.dict("os.environ", {}, clear=True)
    def test_provider_requires_api_key(self):
        provider = SendGridProvider()

        with self.assertRaises(RuntimeError):
            provider.send(
                message="Time to take your medicine.",
                recipient="patient@example.com",
            )

    @patch.dict(
        "os.environ",
        {"SENDGRID_API_KEY": "test-key"},
        clear=True,
    )
    def test_provider_requires_from_email(self):
        provider = SendGridProvider()

        with self.assertRaises(RuntimeError):
            provider.send(
                message="Time to take your medicine.",
                recipient="patient@example.com",
            )
