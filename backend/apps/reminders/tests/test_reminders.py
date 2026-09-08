import pytest
from django.utils import timezone

from apps.profiles.models import PatientProfile
from apps.reminders.models import Reminder


@pytest.mark.django_db
def test_reminder_actions():
    profile = PatientProfile.objects.create(name="Sam Smith", relationship="Child")
    reminder = Reminder.objects.create(
        patient_profile=profile,
        title="Take Vitamin D",
        scheduled_time=timezone.now(),
        status=Reminder.Status.PENDING,
    )
    assert reminder.status == "Pending"

    reminder.status = Reminder.Status.TAKEN
    reminder.save()
    assert reminder.status == "Taken"
