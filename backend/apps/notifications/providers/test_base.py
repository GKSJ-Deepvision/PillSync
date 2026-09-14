from unittest import TestCase

from apps.notifications.providers.base import NotificationProvider


class TestProvider(NotificationProvider):
    def send(self, *, message: str, recipient: str) -> None:
        return None


class NotificationProviderTests(TestCase):
    def test_provider_can_be_implemented(self):
        provider = TestProvider()

        result = provider.send(
            message="Time to take your medicine.",
            recipient="test-recipient",
        )

        self.assertIsNone(result)

    def test_provider_requires_send_method(self):
        with self.assertRaises(TypeError):
            NotificationProvider()
