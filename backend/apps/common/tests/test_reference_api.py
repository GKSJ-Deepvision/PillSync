"""Reference data: the seeded catalogue and the endpoints that expose it."""

from __future__ import annotations

import csv
import json
from io import StringIO

import pytest
from django.core.management import call_command
from django.urls import reverse

from apps.common.choices import MedicineCategory
from apps.common.management.commands.seed_reference_data import (
    CONDITIONS_JSON,
    MEDICINES_CSV,
)
from apps.common.models import MedicalCondition, MedicineReference

pytestmark = pytest.mark.django_db


class TestSeedDataFiles:
    """The committed data files are part of the deliverable, so check them."""

    def test_the_medicine_csv_is_present_and_well_formed(self):
        assert MEDICINES_CSV.is_file(), f"{MEDICINES_CSV} is missing"
        with open(MEDICINES_CSV, encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))

        assert len(rows) > 500, "the catalogue looks truncated"
        required = {"generic_name", "dosage_form", "strength", "category"}
        assert required <= set(rows[0].keys())
        assert all(row["generic_name"].strip() for row in rows)

    def test_every_row_uses_a_known_category(self):
        with open(MEDICINES_CSV, encoding="utf-8", newline="") as handle:
            categories = {row["category"] for row in csv.DictReader(handle)}
        assert categories <= set(MedicineCategory.values)

    def test_all_six_specification_categories_are_covered(self):
        with open(MEDICINES_CSV, encoding="utf-8", newline="") as handle:
            categories = {row["category"] for row in csv.DictReader(handle)}
        expected = {
            MedicineCategory.BLOOD_PRESSURE,
            MedicineCategory.DIABETES,
            MedicineCategory.THYROID,
            MedicineCategory.ANTIBIOTICS,
            MedicineCategory.VITAMINS,
            MedicineCategory.HEART,
        }
        assert expected <= categories

    def test_the_conditions_file_is_present_and_well_formed(self):
        assert CONDITIONS_JSON.is_file()
        payload = json.loads(CONDITIONS_JSON.read_text(encoding="utf-8"))
        codes = {entry["code"] for entry in payload["conditions"]}
        assert {"HYPERTENSION", "TYPE_2_DIABETES", "HYPOTHYROIDISM"} <= codes


class TestSeedCommand:
    def test_seeding_loads_both_datasets(self):
        call_command("seed_reference_data", stdout=StringIO())
        assert MedicineReference.objects.count() > 500
        assert MedicalCondition.objects.count() >= 20

    def test_seeding_twice_does_not_duplicate(self):
        call_command("seed_reference_data", stdout=StringIO())
        first = MedicineReference.objects.count()
        call_command("seed_reference_data", stdout=StringIO())
        assert MedicineReference.objects.count() == first

    def test_a_medicine_keeps_its_secondary_categories(self):
        call_command("seed_reference_data", stdout=StringIO())
        overlapping = MedicineReference.objects.exclude(secondary_categories=[]).first()
        if overlapping is not None:
            assert overlapping.category not in overlapping.secondary_categories


class TestMedicineReferenceModel:
    def test_string_form_reads_like_a_label(self, medicine):
        assert str(medicine) == "Metformin Hydrochloride 500 mg/1 (Tablet, Film Coated)"

    def test_display_name_prefers_the_brand(self, medicine):
        assert medicine.display_name == "Glucophage"

        medicine.brand_name = ""
        assert medicine.display_name == "Metformin Hydrochloride"


class TestReferenceEndpoints:
    def test_medicines_require_authentication(self, api_client):
        assert api_client.get(reverse("v1:medicine-reference-list")).status_code == 401

    def test_medicines_can_be_searched(self, patient_client, medicine):
        response = patient_client.get(
            reverse("v1:medicine-reference-list"), {"search": "metformin"}
        )
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["generic_name"] == "Metformin Hydrochloride"

    def test_medicines_can_be_filtered_by_category(self, patient_client, medicine):
        hit = patient_client.get(reverse("v1:medicine-reference-list"), {"category": "DIABETES"})
        miss = patient_client.get(reverse("v1:medicine-reference-list"), {"category": "THYROID"})
        assert hit.data["count"] == 1
        assert miss.data["count"] == 0

    def test_the_catalogue_is_read_only(self, admin_client):
        response = admin_client.post(
            reverse("v1:medicine-reference-list"), {"generic_name": "Invented"}
        )
        assert response.status_code == 405

    def test_conditions_are_listed(self, patient_client, condition):
        response = patient_client.get(reverse("v1:condition-list"))
        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_category_summary_counts_the_catalogue(self, patient_client, medicine):
        response = patient_client.get(reverse("v1:category-summary"))
        assert response.status_code == 200
        by_code = {row["code"]: row for row in response.data}
        assert by_code["DIABETES"]["medicine_count"] == 1
        assert by_code["DIABETES"]["label"] == "Diabetes"
        # Every category is listed even when it holds nothing yet.
        assert set(by_code) == set(MedicineCategory.values)

    def test_enums_are_public_so_the_signup_form_can_render(self, api_client):
        response = api_client.get(reverse("v1:enums"))
        assert response.status_code == 200
        assert {"roles", "genders", "medicine_categories"} <= response.data.keys()
        assert {"value": "PATIENT", "label": "Patient"} in response.data["roles"]

    def test_health_endpoint_is_public(self, api_client):
        response = api_client.get(reverse("health"))
        assert response.status_code == 200
        assert response.data["status"] == "ok"


class TestPagination:
    def test_page_size_is_capped(self, patient_client, medicine):
        response = patient_client.get(
            reverse("v1:medicine-reference-list"), {"page_size": "100000"}
        )
        assert response.status_code == 200
        # Requesting an enormous page must not return the whole table.
        assert len(response.data["results"]) <= 500


class TestSeedRetirement:
    """A rebuilt catalogue must not leave dropped products in search results."""

    def test_rows_missing_from_the_csv_are_deactivated(self, tmp_path):
        stale = MedicineReference.objects.create(
            generic_name="Withdrawn Compound",
            dosage_form="Tablet",
            strength="10",
            strength_unit="mg/1",
            category=MedicineCategory.OTHER,
        )

        csv_path = tmp_path / "medicines.csv"
        with open(csv_path, "w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(
                handle,
                fieldnames=[
                    "product_ndc",
                    "generic_name",
                    "brand_name",
                    "dosage_form",
                    "route",
                    "strength",
                    "strength_unit",
                    "category",
                    "categories",
                    "pharm_class",
                    "product_type",
                    "requires_prescription",
                ],
            )
            writer.writeheader()
            writer.writerow(
                {
                    "product_ndc": "0001-0001",
                    "generic_name": "Kept Compound",
                    "brand_name": "",
                    "dosage_form": "Tablet",
                    "route": "Oral",
                    "strength": "5",
                    "strength_unit": "mg/1",
                    "category": "DIABETES",
                    "categories": "DIABETES",
                    "pharm_class": "",
                    "product_type": "HUMAN PRESCRIPTION DRUG",
                    "requires_prescription": "true",
                }
            )

        call_command("seed_reference_data", medicines=csv_path, stdout=StringIO())

        stale.refresh_from_db()
        assert stale.is_active is False, "a product no longer in the CSV must be retired"
        assert MedicineReference.objects.get(generic_name="Kept Compound").is_active is True

    def test_retired_rows_disappear_from_the_api(self, patient_client, medicine):
        medicine.is_active = False
        medicine.save(update_fields=["is_active"])

        response = patient_client.get(
            reverse("v1:medicine-reference-list"), {"search": "metformin"}
        )
        assert response.data["count"] == 0
