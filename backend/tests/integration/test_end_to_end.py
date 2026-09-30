"""The whole product, driven through the public API the way the SPA drives it.

No shortcuts: real registration and JWT login, no force_authenticate, no direct
model writes for anything a user could do through the interface. If this passes,
the specification's workflow - prescription in, reminders out, adherence and
refills tracked, caregiver informed - works as one system and not just as
seven apps that each pass their own tests.

Story: Asha registers, invites her daughter Nina as a caregiver, photographs a
prescription, reviews and confirms it, takes one dose and misses another, runs
low on a medicine and is told, refills, and reads her adherence. An
administrator watches the platform throughout.
"""

from __future__ import annotations

import io
from datetime import timedelta
from decimal import Decimal

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient

from apps.common.choices import NotificationCategory, UserRole
from apps.common.models import MedicineReference
from apps.notifications.models import NotificationLog
from apps.ocr.services import engines
from apps.reminders.models import DoseEvent

pytestmark = pytest.mark.django_db

PASSWORD = "correct-horse-battery-42"  # pragma: allowlist secret

PRESCRIPTION = """Dr. Meera Iyer
City Care Clinic
Date: 12/03/2026
Rx
1. Tab Metformin 500 mg 1-0-1 x 30 days
2. Tab Amlodipine 5 mg 0-0-1 x 30 days
"""


class ScannerStub:
    """Stands in for Tesseract; everything else in the pipeline is real."""

    name = "stub"

    def read(self, image):
        return engines.OCRResult(text=PRESCRIPTION, confidence=0.93, engine="stub")


@pytest.fixture(autouse=True)
def _environment(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    settings.OCR_ENGINE = "tests.integration.test_end_to_end.ScannerStub"
    settings.OCR_ASYNC = False
    for i, (generic, brand, strength, category) in enumerate(
        [
            ("Metformin Hydrochloride", "Glucophage", "500", "DIABETES"),
            ("Amlodipine Besylate", "Norvasc", "5", "HYPERTENSION"),
        ]
    ):
        MedicineReference.objects.create(
            product_ndc=f"9999-{i:04d}",
            generic_name=generic,
            brand_name=brand,
            dosage_form="Tablet",
            route="Oral",
            strength=strength,
            strength_unit="mg/1",
            category=category,
        )


def register(email, name, role):
    response = APIClient().post(
        reverse("v1:auth:register"),
        {
            "email": email,
            "full_name": name,
            "password": PASSWORD,
            "password_confirm": PASSWORD,
            "role": role,
        },
        format="json",
    )
    assert response.status_code == 201, response.data
    return response.data


def signed_in(email) -> APIClient:
    """A client holding a real bearer token from a real login."""
    response = APIClient().post(
        reverse("v1:auth:login"), {"email": email, "password": PASSWORD}, format="json"
    )
    assert response.status_code == 200, response.data
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
    return client


def rows(response):
    data = response.data
    return data["results"] if isinstance(data, dict) and "results" in data else data


def test_the_full_workflow(make_user):
    # -- 1. Accounts -------------------------------------------------------
    register("asha@example.com", "Asha Rao", UserRole.PATIENT)
    register("nina@example.com", "Nina Rao", UserRole.CAREGIVER)
    admin = make_user("ops@example.com", UserRole.ADMIN, is_staff=True)
    asha, nina = signed_in("asha@example.com"), signed_in("nina@example.com")
    ops = signed_in(admin.email)
    profile_id = rows(asha.get(reverse("v1:patient-profile-list")))[0]["id"]

    # -- 2. The patient invites a caregiver, and grants access -------------
    invite = asha.post(
        reverse("v1:caregiver-assignment-list"),
        {"caregiver_email": "nina@example.com", "relationship": "FAMILY"},
        format="json",
    )
    assert invite.status_code == 201, invite.data
    assert nina.get(reverse("v1:refill-list")).data == []
    asha.post(reverse("v1:caregiver-assignment-accept", args=[invite.data["id"]]))

    # -- 3. Photograph a prescription, review, confirm ---------------------
    buffer = io.BytesIO()
    Image.new("RGB", (600, 400), "white").save(buffer, format="PNG")
    scan = asha.post(
        reverse("v1:ocr-job-list"),
        {
            "patient": profile_id,
            "image": SimpleUploadedFile("rx.png", buffer.getvalue(), content_type="image/png"),
        },
        format="multipart",
    )
    assert scan.status_code == 201, scan.data
    assert scan.data["status"] == "COMPLETED"
    assert [i["name"] for i in scan.data["items"]] == ["Metformin", "Amlodipine"]
    assert all(i["reference"] for i in scan.data["items"]), "both should match the catalogue"

    confirmed = asha.post(reverse("v1:ocr-job-confirm", args=[scan.data["id"]]), {}, format="json")
    assert confirmed.status_code == 200, confirmed.data
    assert len(confirmed.data["medicines"]) == 2
    assert confirmed.data["prescription"]["doctor_name"]

    medicines = {m["name"]: m for m in rows(asha.get(reverse("v1:medicine-list")))}
    metformin, amlodipine = medicines["Metformin"], medicines["Amlodipine"]
    assert Decimal(metformin["quantity_remaining"]) == Decimal("60")
    assert len(metformin["schedules"]) == 2  # 1-0-1

    # -- 4. Reminders exist; take one dose, miss another -------------------
    doses = rows(
        asha.get(reverse("v1:dose-list"), {"medicine": metformin["id"], "status": "PENDING"})
    )
    assert len(doses) >= 2

    # The API cannot move the clock, and which doses come first depends on the hour the
    # test runs (near midnight the next two are tomorrow's, outside "today's" adherence).
    # So put these two reminders in the past, as if a day had gone by.
    yesterday = timezone.now() - timedelta(days=1)
    for hours, dose in enumerate(doses[:2]):
        DoseEvent.objects.filter(pk=dose["id"]).update(
            scheduled_for=yesterday - timedelta(hours=hours)
        )
    taken = asha.post(reverse("v1:dose-take", args=[doses[0]["id"]]), {}, format="json")
    assert taken.status_code == 200, taken.data
    assert taken.data["status"] == "TAKEN"
    missed = asha.post(reverse("v1:dose-miss", args=[doses[1]["id"]]), {}, format="json")
    assert missed.data["status"] == "MISSED"

    after = asha.get(reverse("v1:medicine-detail", args=[metformin["id"]])).data
    assert Decimal(after["quantity_remaining"]) == Decimal("59"), "one dose out of stock"

    # The missed dose reached the caregiver.
    assert NotificationLog.objects.filter(
        recipient__email="nina@example.com", category=NotificationCategory.CAREGIVER_ALERT
    ).exists()

    # -- 5. Adherence reflects it -----------------------------------------
    adherence = asha.get(reverse("v1:adherence-summary")).data
    assert adherence["taken"] == 1 and adherence["missed"] == 1
    assert adherence["adherence_rate"] == 50.0

    # -- 6. Running low: forecast, alert, caregiver told -------------------
    forecast = {r["medicine_name"]: r for r in asha.get(reverse("v1:refill-list")).data}
    assert forecast["Metformin"]["status"] in {"OK", "COVERED"}

    asha.post(
        reverse("v1:medicine-adjust-stock", args=[amlodipine["id"]]),
        {"quantity": "3", "reason": "Counted the strip"},
        format="json",
    )
    urgent = asha.get(reverse("v1:refill-list")).data[0]
    assert urgent["medicine_name"] == "Amlodipine"
    assert urgent["status"] in {"LOW", "CRITICAL"}
    assert "Amlodipine" in urgent["message"]

    refill_alerts = NotificationLog.objects.filter(category=NotificationCategory.REFILL_DUE)
    assert refill_alerts.filter(recipient__email="asha@example.com").exists()
    assert refill_alerts.filter(recipient__email="nina@example.com").exists()

    overview = nina.get(reverse("v1:analytics-caregiver")).data
    assert overview["patients"][0]["name"] == "Asha Rao"
    assert overview["patients"][0]["refills_needing_attention"] == 1

    # Asking again does not nag.
    before = refill_alerts.count()
    asha.post(reverse("v1:refill-recompute"))
    assert refill_alerts.count() == before

    # -- 7. Refill: the alert clears -------------------------------------
    asha.post(
        reverse("v1:medicine-refill", args=[amlodipine["id"]]), {"quantity": "30"}, format="json"
    )
    recovered = {r["medicine_name"]: r for r in asha.get(reverse("v1:refill-list")).data}
    assert recovered["Amlodipine"]["status"] in {"OK", "COVERED"}
    history = asha.get(reverse("v1:medicine-stock-history", args=[amlodipine["id"]])).data
    assert [e["kind"] for e in history] == ["REFILL", "ADJUSTMENT", "INITIAL"]

    # -- 8. Dashboards -----------------------------------------------------
    dashboard = asha.get(reverse("v1:analytics-dashboard")).data
    assert dashboard["active_medicines"] == 2
    assert dashboard["refills"]["needs_attention"] == 0

    report = asha.get(reverse("v1:adherence-report"), {"period": "weekly", "export": "csv"})
    assert report.status_code == 200 and b"adherence_rate_percent" in report.content

    platform = ops.get(reverse("v1:analytics-admin")).data
    assert platform["users"]["patients"] == 1 and platform["users"]["caregivers"] == 1
    assert platform["ocr"]["confirmed"] == 1
    assert ops.get(reverse("v1:analytics-performance")).data["requests"] > 10

    # -- 9. Boundaries held throughout -----------------------------------
    assert asha.get(reverse("v1:analytics-admin")).status_code == 403
    assert nina.get(reverse("v1:analytics-admin")).status_code == 403
    stranger = register("ravi@example.com", "Ravi", UserRole.PATIENT)
    ravi = signed_in("ravi@example.com")
    assert ravi.get(reverse("v1:ocr-job-detail", args=[scan.data["id"]])).status_code == 404
    assert ravi.get(reverse("v1:ocr-job-image", args=[scan.data["id"]])).status_code == 404
    assert rows(ravi.get(reverse("v1:medicine-list"))) == []
    assert stranger["user"]["email"] == "ravi@example.com"
