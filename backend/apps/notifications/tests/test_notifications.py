import pytest

from apps.notifications.models import Notification
from apps.profiles.models import PatientProfile


@pytest.mark.django_db
def test_create_notification():
    profile = PatientProfile.objects.create(name="Notification User", relationship="Self")
    notif = Notification.objects.create(
        patient_profile=profile,
        title="Refill Alert",
        message="Your BP medicine is expected to finish in 4 days. Please arrange a refill.",
        notification_type=Notification.Type.REFILL,
    )

    assert notif.patient_profile == profile
    assert notif.notification_type == "Refill"
    assert notif.is_read is False
