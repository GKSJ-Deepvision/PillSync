"""Load the medicine catalogue and condition list into the database.

    python manage.py seed_reference_data

The data files are committed, so a fresh clone can seed without downloading
anything. To rebuild them from the current FDA release:

    python ml/src/common/build_medicine_reference.py --refresh

Idempotent: run it as often as you like. Rows are matched on their natural key
and updated in place, so re-running after a rebuild refreshes the catalogue
instead of duplicating it.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.common.choices import MedicineCategory
from apps.common.models import MedicalCondition, MedicineReference

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
MEDICINES_CSV = DATA_DIR / "medicines_seed.csv"
CONDITIONS_JSON = DATA_DIR / "conditions_seed.json"

VALID_CATEGORIES = set(MedicineCategory.values)
BATCH_SIZE = 500


class Command(BaseCommand):
    help = "Seed medicine reference and medical condition data."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--medicines",
            type=Path,
            default=MEDICINES_CSV,
            help="Path to the medicines CSV.",
        )
        parser.add_argument(
            "--conditions",
            type=Path,
            default=CONDITIONS_JSON,
            help="Path to the conditions JSON.",
        )
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete existing reference rows first. Refuses if any patient links exist.",
        )

    def handle(self, *args, **options) -> None:
        medicines_path: Path = options["medicines"]
        conditions_path: Path = options["conditions"]

        if options["flush"]:
            self._flush()

        conditions = self._seed_conditions(conditions_path)
        medicines = self._seed_medicines(medicines_path)

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {conditions} conditions and {medicines} medicines. "
                f"Catalogue now holds {MedicineReference.objects.count()} entries."
            )
        )

    # -- steps ------------------------------------------------------------

    def _flush(self) -> None:
        from apps.profiles.models import PatientCondition

        if PatientCondition.objects.exists():
            raise CommandError(
                "Patients are linked to existing conditions. Refusing to flush - "
                "seeding without --flush updates rows in place and is safe."
            )
        deleted_m, _ = MedicineReference.objects.all().delete()
        deleted_c, _ = MedicalCondition.objects.all().delete()
        self.stdout.write(f"Flushed {deleted_m} medicines and {deleted_c} conditions.")

    def _seed_conditions(self, path: Path) -> int:
        if not path.is_file():
            raise CommandError(f"Conditions file not found: {path}")

        payload = json.loads(path.read_text(encoding="utf-8"))
        count = 0
        with transaction.atomic():
            for entry in payload.get("conditions", []):
                category = entry.get("category", MedicineCategory.OTHER)
                if category not in VALID_CATEGORIES:
                    category = MedicineCategory.OTHER
                MedicalCondition.objects.update_or_create(
                    code=entry["code"],
                    defaults={
                        "name": entry["name"],
                        "category": category,
                        "is_chronic": bool(entry.get("chronic", True)),
                        "is_active": True,
                    },
                )
                count += 1
        return count

    def _seed_medicines(self, path: Path) -> int:
        if not path.is_file():
            raise CommandError(
                f"Medicines file not found: {path}\n"
                "Build it with: python ml/src/common/build_medicine_reference.py"
            )

        existing = {
            (row[0].lower(), row[1].lower(), row[2].lower(), row[3].lower()): row[4]
            for row in MedicineReference.objects.values_list(
                "generic_name", "dosage_form", "strength", "strength_unit", "id"
            )
        }

        to_create: list[MedicineReference] = []
        to_update: list[MedicineReference] = []
        seen: set[tuple[str, str, str, str]] = set()
        skipped = 0

        with open(path, encoding="utf-8", newline="") as handle:
            for row in csv.DictReader(handle):
                # Truncate to the column widths *before* building the key: the
                # key has to match what is actually stored, or a second run
                # would try to insert a row that is already there.
                generic = (row.get("generic_name") or "").strip()[:255]
                if not generic:
                    skipped += 1
                    continue

                dosage_form = (row.get("dosage_form") or "").strip()[:128]
                strength = (row.get("strength") or "").strip()[:64]
                unit = (row.get("strength_unit") or "").strip()[:64]
                key = (generic.lower(), dosage_form.lower(), strength.lower(), unit.lower())
                if key in seen:
                    skipped += 1
                    continue
                seen.add(key)

                category = (row.get("category") or "").strip().upper()
                if category not in VALID_CATEGORIES:
                    category = MedicineCategory.OTHER

                secondary = [
                    part
                    for part in (row.get("categories") or "").split("|")
                    if part and part != category and part in VALID_CATEGORIES
                ]

                fields = {
                    "product_ndc": (row.get("product_ndc") or "").strip()[:32],
                    "generic_name": generic,
                    "brand_name": (row.get("brand_name") or "").strip()[:255],
                    "dosage_form": dosage_form,
                    "route": (row.get("route") or "").strip()[:128],
                    "strength": strength,
                    "strength_unit": unit,
                    "category": category,
                    "secondary_categories": secondary,
                    "pharm_class": (row.get("pharm_class") or "").strip()[:500],
                    "requires_prescription": (
                        row.get("requires_prescription", "true").strip().lower() == "true"
                    ),
                    "is_active": True,
                }

                pk = existing.get(key)
                if pk is None:
                    to_create.append(MedicineReference(**fields))
                else:
                    to_update.append(MedicineReference(id=pk, **fields))

        with transaction.atomic():
            if to_create:
                MedicineReference.objects.bulk_create(to_create, batch_size=BATCH_SIZE)
            if to_update:
                MedicineReference.objects.bulk_update(
                    to_update,
                    [
                        "product_ndc",
                        "brand_name",
                        "route",
                        "category",
                        "secondary_categories",
                        "pharm_class",
                        "requires_prescription",
                        "is_active",
                    ],
                    batch_size=BATCH_SIZE,
                )

        self.stdout.write(
            f"  medicines: {len(to_create)} created, {len(to_update)} updated, {skipped} skipped"
        )
        return len(to_create) + len(to_update)
