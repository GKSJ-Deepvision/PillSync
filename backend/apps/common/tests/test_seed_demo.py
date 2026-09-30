"""The demo seeder: safe by default, repeatable, and it tells the story it promises."""

from __future__ import annotations

import io

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.urls import reverse

from apps.accounts.models import User
from apps.refills.models import RefillPrediction
from apps.reminders.models import DoseEvent

pytestmark = pytest.mark.django_db

PASSWORD = "demo-password-for-tests-1"  # pragma: allowlist secret


def seed(**kwargs):
    call_command("seed_demo", password=PASSWORD, stdout=io.StringIO(), **kwargs)


@pytest.fixture(autouse=True)
def _debug(settings):
    settings.DEBUG = True


def test_it_refuses_to_run_with_debug_off(settings):
    settings.DEBUG = False
    with pytest.raises(CommandError, match="DEBUG"):
        seed()
    assert not User.objects.exists()


def test_force_overrides_that(settings):
    settings.DEBUG = False
    seed(force=True)
    assert User.objects.filter(email__endswith="@pillsync.example").count() == 4


def test_running_twice_is_refused_rather_than_duplicating():
    seed()
    with pytest.raises(CommandError, match="--reset"):
        seed()


def test_reset_recreates_cleanly():
    seed()
    seed(reset=True)
    assert User.objects.filter(email__endswith="@pillsync.example").count() == 4


def test_it_does_not_touch_real_accounts(make_user):
    make_user("real.person@example.com")
    seed(reset=True)
    assert User.objects.filter(email="real.person@example.com").exists()


def test_the_demo_is_deterministic():
    seed()
    first = list(
        DoseEvent.objects.order_by("scheduled_for", "slot").values_list("status", flat=True)
    )
    seed(reset=True)
    second = list(
        DoseEvent.objects.order_by("scheduled_for", "slot").values_list("status", flat=True)
    )
    assert first == second


def test_the_demo_tells_the_story_it_promises(auth_client):
    seed()
    asha = User.objects.get(email="asha.rao@pillsync.example")
    client = auth_client(asha)

    summary = client.get(reverse("v1:adherence-summary")).data
    assert summary["resolved"] > 100
    assert 60 < summary["adherence_rate"] < 95
    # The evening habit the seeder builds in should be found.
    assert any(
        "night" in line or "evening" in line for line in summary["missed_analysis"]["insights"]
    )

    refills = client.get(reverse("v1:refill-list")).data
    assert any(r["status"] in {"LOW", "CRITICAL", "OUT"} for r in refills)
    assert any(r["status"] in {"OK", "COVERED"} for r in refills)
    assert RefillPrediction.objects.count() >= 4


def test_the_caregiver_sees_the_struggling_patient_first(auth_client):
    seed()
    meera = User.objects.get(email="meera.rao@pillsync.example")
    rows = auth_client(meera).get(reverse("v1:analytics-caregiver")).data["patients"]

    assert [r["name"] for r in rows][0] == "Ravi Kumar"
    assert rows[0]["attention"]["reasons"]


def test_the_admin_dashboard_works_on_the_demo(auth_client):
    seed()
    admin = User.objects.get(email="admin.demo@pillsync.example")
    data = auth_client(admin).get(reverse("v1:analytics-admin")).data
    assert data["users"]["patients"] == 2
    assert data["doses"]["adherence_rate"] is not None


def test_extra_patients_are_created_for_load_testing_and_cannot_sign_in():
    seed(extra_patients=3)
    load = User.objects.filter(email__startswith="load.patient.")
    assert load.count() == 3
    assert all(not u.has_usable_password() for u in load)
    assert all(u.patient_profile.medicines.exists() for u in load)


def test_no_extra_patients_by_default():
    seed()
    assert not User.objects.filter(email__startswith="load.patient.").exists()
