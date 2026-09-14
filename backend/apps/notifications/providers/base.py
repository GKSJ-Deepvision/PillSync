from abc import ABC, abstractmethod


class NotificationProvider(ABC):
    """Base interface for notification delivery providers."""

    @abstractmethod
    def send(self, *, message: str, recipient: str) -> None:
        """Send a notification to a recipient."""
        raise NotImplementedError
