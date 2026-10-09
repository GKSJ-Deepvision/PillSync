"""Notification preferences, quiet hours, device registration and the delivery log."""

from __future__ import annotations

from datetime import datetime, time
from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.common.choices import (
    DoseSlot,
    NotificationCategory,
    NotificationChannel,
    NotificationStatus,
)
from apps.medications.models import MedicationSchedule, Medicine
from apps.notifications.models import DeviceToken, NotificationLog, NotificationPreference
from apps.notifications.providers.base import ConsoleProvider, Message
from apps.notifications.services import dispatcher
from apps.reminders.models import DoseEvent

pytestmark = pytest.mark.django_db


@pytest.fixture
def dose(db, patient):
    medicine = Medicine.objects.create(
        patient=patient.patient_profile,
        name="Metformin",
        category="DIABETES",
        quantity_remaining=Decimal("30"),
    )
    schedule = MedicationSchedule.objects.create(
        medicine=medicine, slot=DoseSlot.MORNING, time_of_day=time(8, 0)
    )
    return DoseEvent.objects.create(
        schedule=schedule,
        medicine=medicine,
        patient=medicine.patient,
        scheduled_for=timezone.now(),
        quantity_expected=Decimal("2"),
    )


class TestQuietHours:
    def _preference(self, user, start, end):
        preference = dispatcher.preferences_for(user)
        preference.quiet_hours_start = start
        preference.quiet_hours_end = end
        preference.save()
        return preference

    def test_a_window_inside_one_day(self, patient):
        preference = self._preference(patient, time(13, 0), time(14, 0))
        assert preference.in_quiet_hours(datetime(2026, 6, 1, 13, 30))
        assert not preference.in_quiet_hours(datetime(2026, 6, 1, 12, 0))

    def test_a_window_that_wraps_midnight(self, patient):
        """22:00 to 07:00 is the default, and the interesting case."""
        preference = self._preference(patient, time(22, 0), time(7, 0))

        assert preference.in_quiet_hours(datetime(2026, 6, 1, 23, 0))
        assert preference.in_quiet_hours(datetime(2026, 6, 1, 3, 0))
        assert not preference.in_quiet_hours(datetime(2026, 6, 1, 12, 0))

    def test_no_window_means_never_quiet(self, patient):
        preference = self._preference(patient, None, None)
        assert not preference.in_quiet_hours(datetime(2026, 6, 1, 3, 0))

    def test_deferrable_notices_are_held_during_quiet_hours(self, patient):
        """Low stock can wait until morning."""
        preference = self._preference(patient, time(0, 0), time(23, 59))
        assert not preference.should_send(
            NotificationCategory.LOW_STOCK,
            NotificationChannel.PUSH,
            at=datetime(2026, 6, 1, 3, 0),
        )

    def test_a_dose_reminder_is_never_silenced_by_quiet_hours(self, patient):
        """The patient chose that dose time; suppressing it defeats the app.

        A 06:00 thyroid tablet and a 22:30 statin both fall inside the default
        22:00-07:00 window, and those are precisely the doses people forget.
        """
        preference = self._preference(patient, time(22, 0), time(7, 0))
        assert preference.should_send(
            NotificationCategory.DOSE_REMINDER,
            NotificationChannel.PUSH,
            at=datetime(2026, 6, 1, 6, 0),
        )
        assert preference.should_send(
            NotificationCategory.DOSE_REMINDER,
            NotificationChannel.PUSH,
            at=datetime(2026, 6, 1, 22, 30),
        )

    def test_an_urgent_alert_still_gets_through(self, patient):
        """A caregiver hearing about a missed dose at 03:00 is the point."""
        preference = self._preference(patient, time(0, 0), time(23, 59))
        assert preference.should_send(
            NotificationCategory.CAREGIVER_ALERT,
            NotificationChannel.PUSH,
            at=datetime(2026, 6, 1, 3, 0),
        )


class TestPreferenceToggles:
    def test_a_disabled_category_blocks_the_send(self, patient):
        preference = dispatcher.preferences_for(patient)
        preference.dose_reminders = False
        preference.quiet_hours_start = None
        preference.quiet_hours_end = None
        preference.save()

        assert not preference.should_send(
            NotificationCategory.DOSE_REMINDER, NotificationChannel.PUSH
        )

    def test_a_disabled_channel_blocks_the_send(self, patient):
        preference = dispatcher.preferences_for(patient)
        preference.sms_enabled = False
        preference.save()

        assert not preference.should_send(
            NotificationCategory.DOSE_REMINDER, NotificationChannel.SMS
        )


class TestDispatch:
    def test_a_send_is_logged(self, patient):
        logs = dispatcher.send(
            recipient=patient,
            category=NotificationCategory.DOSE_REMINDER,
            subject="Morning medicine",
            body="Time to take 2 × Metformin.",
            channels=(NotificationChannel.PUSH,),
        )
        assert len(logs) == 1
        assert logs[0].status == NotificationStatus.SENT

    def test_a_blocked_send_is_logged_as_skipped_not_dropped(self, patient):
        """'Why didn't I get a reminder' has to be answerable."""
        preference = dispatcher.preferences_for(patient)
        preference.dose_reminders = False
        preference.save()

        logs = dispatcher.send(
            recipient=patient,
            category=NotificationCategory.DOSE_REMINDER,
            subject="Morning medicine",
            body="…",
            channels=(NotificationChannel.PUSH,),
        )
        assert logs[0].status == NotificationStatus.SKIPPED
        assert "preferences" in logs[0].error

    def test_a_deactivated_account_receives_nothing(self, patient):
        patient.is_active = False
        patient.save(update_fields=["is_active"])

        assert (
            dispatcher.send(
                recipient=patient,
                category=NotificationCategory.DOSE_REMINDER,
                subject="x",
                body="y",
            )
            == []
        )

    def test_the_reminder_records_that_it_went_out(self, dose):
        dispatcher.notify_dose_due(dose)

        dose.refresh_from_db()
        assert dose.reminder_sent_at is not None
        log = NotificationLog.objects.get(category=NotificationCategory.DOSE_REMINDER)
        assert log.dose_event_id == dose.pk
        assert log.payload["dose_event_id"] == str(dose.pk)

    def test_a_dependent_profiles_reminder_goes_to_its_manager(self, patient):
        """A profile with no login of its own still has to reach someone."""
        from apps.profiles.models import PatientProfile

        dependent = PatientProfile.objects.create(
            managed_by=patient, full_name="Asha's Mother", is_self=False
        )
        medicine = Medicine.objects.create(
            patient=dependent, name="Amlodipine", quantity_remaining=Decimal("30")
        )
        schedule = MedicationSchedule.objects.create(medicine=medicine, time_of_day=time(9, 0))
        dose = DoseEvent.objects.create(
            schedule=schedule,
            medicine=medicine,
            patient=dependent,
            scheduled_for=timezone.now(),
        )

        dispatcher.notify_dose_due(dose)
        assert NotificationLog.objects.filter(recipient=patient).exists()


class TestConsoleProvider:
    def test_it_always_succeeds_so_the_pipeline_runs_without_credentials(self):
        result = ConsoleProvider().send(
            Message(
                recipient_email="a@example.com",
                recipient_phone="",
                subject="Subject",
                body="Body",
            )
        )
        assert result.ok


class TestNotificationApi:
    def test_preferences_are_created_on_first_read(self, patient_client, patient):
        assert not NotificationPreference.objects.filter(user=patient).exists()

        response = patient_client.get(reverse("v1:notification-preferences"))
        assert response.status_code == 200
        assert NotificationPreference.objects.filter(user=patient).exists()

    def test_preferences_can_be_updated(self, patient_client):
        response = patient_client.patch(
            reverse("v1:notification-preferences"), {"sms_enabled": True}, format="json"
        )
        assert response.status_code == 200
        assert response.data["sms_enabled"] is True

    def test_half_a_quiet_hours_window_is_rejected(self, patient_client):
        response = patient_client.patch(
            reverse("v1:notification-preferences"),
            {"quiet_hours_start": "22:00", "quiet_hours_end": None},
            format="json",
        )
        assert response.status_code == 400

    def test_a_device_can_register(self, patient_client, patient):
        response = patient_client.post(
            reverse("v1:device-token-list"),
            {"token": "fcm-token-abc", "platform": "WEB", "device_name": "Chrome"},
            format="json",
        )
        assert response.status_code == 201
        assert DeviceToken.objects.filter(user=patient, is_active=True).count() == 1

    def test_registering_the_same_token_twice_does_not_error(self, patient_client):
        payload = {"token": "fcm-token-abc", "platform": "WEB"}
        assert patient_client.post(reverse("v1:device-token-list"), payload).status_code == 201
        assert patient_client.post(reverse("v1:device-token-list"), payload).status_code == 200

    def test_a_shared_device_moves_to_whoever_registers_it(
        self, auth_client, patient, other_patient
    ):
        """FCM reissues one token per browser, whoever is signed in."""
        payload = {"token": "shared-device-token", "platform": "WEB"}
        auth_client(patient).post(reverse("v1:device-token-list"), payload)
        auth_client(other_patient).post(reverse("v1:device-token-list"), payload)

        token = DeviceToken.objects.get(token="shared-device-token")
        assert token.user == other_patient
        assert DeviceToken.objects.count() == 1

    def test_unregistering_deactivates_rather_than_deletes(self, patient_client, patient):
        created = patient_client.post(
            reverse("v1:device-token-list"), {"token": "t1", "platform": "WEB"}
        )
        url = reverse("v1:device-token-detail", args=[created.data["id"]])

        assert patient_client.delete(url).status_code == 204
        assert DeviceToken.objects.get(pk=created.data["id"]).is_active is False

    def test_a_user_only_sees_their_own_notifications(self, patient_client, patient, other_patient):
        dispatcher.send(
            recipient=other_patient,
            category=NotificationCategory.DOSE_REMINDER,
            subject="Not yours",
            body="…",
        )
        response = patient_client.get(reverse("v1:notification-log-list"))
        assert response.data["count"] == 0

    def test_delivery_stats_report_the_success_rate(self, patient_client, patient):
        dispatcher.send(
            recipient=patient,
            category=NotificationCategory.DOSE_REMINDER,
            subject="One",
            body="…",
            channels=(NotificationChannel.PUSH,),
        )
        NotificationLog.objects.create(
            recipient=patient,
            category=NotificationCategory.DOSE_REMINDER,
            channel=NotificationChannel.PUSH,
            status=NotificationStatus.FAILED,
            body="…",
        )

        stats = patient_client.get(reverse("v1:notification-log-delivery-stats")).data
        assert stats["sent"] == 1
        assert stats["failed"] == 1
        assert stats["success_rate_percent"] == 50.0

    def test_anonymous_access_is_refused(self, api_client):
        assert api_client.get(reverse("v1:notification-preferences")).status_code == 401
        assert api_client.get(reverse("v1:device-token-list")).status_code == 401
