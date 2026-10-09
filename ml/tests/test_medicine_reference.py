"""Tests for the medicine reference builder.

The categorisation rules are the part worth testing: everything downstream -
disease-based organisation, condition-aware suggestions, OCR matching - depends
on a medicine landing in the right bucket.
"""

from __future__ import annotations

import csv
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "ml" / "src" / "common"))

import build_medicine_reference as builder  # noqa: E402

SEED_CSV = REPO_ROOT / "backend" / "apps" / "common" / "data" / "medicines_seed.csv"
SAMPLE_CSV = REPO_ROOT / "ml" / "data" / "samples" / "medicines_sample.csv"


class TestCategorise:
    @pytest.mark.parametrize(
        ("pharm_class", "substance", "generic", "expected"),
        [
            ("Biguanide [EPC]", "METFORMIN HYDROCHLORIDE", "metformin", "DIABETES"),
            ("Insulin [EPC]", "INSULIN HUMAN", "insulin human", "DIABETES"),
            ("", "LEVOTHYROXINE SODIUM", "levothyroxine sodium", "THYROID"),
            ("Angiotensin Converting Enzyme Inhibitor [EPC]", "LISINOPRIL", "lisinopril", "BLOOD_PRESSURE"),
            ("HMG-CoA Reductase Inhibitor [EPC]", "ATORVASTATIN", "atorvastatin", "HEART"),
            ("Macrolide Antimicrobial [EPC]", "AZITHROMYCIN", "azithromycin", "ANTIBIOTICS"),
            ("", "ASCORBIC ACID", "vitamin c", "VITAMINS"),
        ],
    )
    def test_known_medicines_land_in_the_right_category(
        self, pharm_class, substance, generic, expected
    ):
        assert builder.categorise(pharm_class, substance, generic)[0] == expected

    def test_an_unrelated_medicine_matches_nothing(self):
        assert builder.categorise("Local Anesthetic [EPC]", "BENZOCAINE", "benzocaine") == []

    def test_a_beta_blocker_is_primarily_blood_pressure(self):
        """Metoprolol treats both, and the specification lists them separately.

        Blood pressure wins because that is what it is most often dispensed for;
        the heart category is kept as a secondary match rather than lost.
        """
        matched = builder.categorise("beta-Adrenergic Blocker [EPC]", "METOPROLOL", "metoprolol")
        assert matched[0] == "BLOOD_PRESSURE"


class TestFormFilter:
    @pytest.mark.parametrize(
        "form", ["TABLET", "CAPSULE, GELATIN COATED", "INJECTION, SOLUTION", "SYRUP"]
    )
    def test_home_dosage_forms_are_kept(self, form):
        assert builder.keep_form(form)

    @pytest.mark.parametrize("form", ["PATCH", "GAS", "IMPLANT", "SHAMPOO"])
    def test_other_forms_are_dropped(self, form):
        assert not builder.keep_form(form)


class TestTitleCase:
    def test_all_caps_names_become_readable(self):
        assert builder.title_case("METFORMIN HYDROCHLORIDE") == "Metformin Hydrochloride"

    def test_short_uppercase_tokens_are_preserved(self):
        assert builder.title_case("ASPIRIN XR") == "Aspirin XR"

    def test_whitespace_is_collapsed(self):
        assert builder.title_case("  LOSARTAN   POTASSIUM ") == "Losartan Potassium"


class TestGeneratedFiles:
    def test_the_seed_file_exists_and_has_the_expected_columns(self):
        assert SEED_CSV.is_file(), "run ml/src/common/build_medicine_reference.py first"
        with open(SEED_CSV, encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            assert list(reader.fieldnames) == builder.FIELDNAMES
            assert sum(1 for _ in reader) > 500

    def test_the_committed_sample_is_small_enough_for_tests(self):
        assert SAMPLE_CSV.is_file()
        with open(SAMPLE_CSV, encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))
        assert 0 < len(rows) <= builder.SAMPLE_ROWS
