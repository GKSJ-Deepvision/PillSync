"""Catalogue matching, run against the real seeded FDA catalogue.

Hand-built entries would only prove the matcher agrees with the author. The
committed seed CSV is 1,700+ real presentations, so a threshold that is too loose
(wrong matches) or too tight (missed matches) shows up here.
"""

from __future__ import annotations

import csv
from functools import cache

import pytest

from apps.common.management.commands.seed_reference_data import MEDICINES_CSV
from apps.ocr.services import matcher
from apps.ocr.services.matcher import Entry, MatchResult, core_tokens, rank_entries


@cache
def catalogue() -> tuple[Entry, ...]:
    with open(MEDICINES_CSV, encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    return tuple(
        Entry(
            id=str(i),
            generic=row["generic_name"],
            brand=row["brand_name"],
            strength=row["strength"],
            unit=row["strength_unit"],
            form=row["dosage_form"],
            category=row["category"],
        )
        for i, row in enumerate(rows)
    )


def match(name, **kwargs) -> MatchResult:
    return rank_entries(name, list(catalogue()), **kwargs)


class TestCoreTokens:
    def test_salts_and_release_suffixes_are_dropped(self):
        assert core_tokens("Metformin Hydrochloride ER") == ["metformin"]

    def test_the_international_name_is_mapped_to_the_catalogue_name(self):
        assert core_tokens("Paracetamol") == ["acetaminophen"]

    def test_a_brand_is_mapped_to_its_generic(self):
        assert core_tokens("Glycomet") == ["metformin"]

    def test_vitamin_phrases(self):
        assert core_tokens("Vitamin D3") == ["cholecalciferol"]

    def test_a_number_is_not_part_of_the_name(self):
        assert core_tokens("Dolo 650") == ["acetaminophen"]

    def test_a_name_made_only_of_filler_keeps_something(self):
        assert core_tokens("Sodium") == ["sodium"]


class TestRealCatalogue:
    @pytest.mark.parametrize(
        "name",
        ["Metformin", "Amlodipine", "Levothyroxine", "Atorvastatin", "Lisinopril", "Losartan",
         "Metoprolol", "Warfarin", "Azithromycin", "Amoxicillin", "Glimepiride"],
    )  # fmt: skip
    def test_common_generics_match_confidently(self, name):
        result = match(name)
        assert result.level == "AUTO", (name, result.score)
        assert name.lower() in result.entry.generic.lower()

    def test_a_salt_written_differently_still_matches(self):
        result = match("Metformin HCl")
        assert result.level == "AUTO"
        assert "metformin" in result.entry.generic.lower()

    @pytest.mark.parametrize(
        ("typo", "expected"),
        [("Metforminn", "metformin"), ("Amlodipne", "amlodipine"), ("Atorvastain", "atorvastatin"),
         ("Levothyroxin", "levothyroxine"), ("Lisinopryl", "lisinopril")],
    )  # fmt: skip
    def test_one_character_ocr_errors_are_survived(self, typo, expected):
        result = match(typo)
        assert result.entry is not None, typo
        assert expected in result.entry.generic.lower()

    def test_a_brand_name_reaches_its_generic(self):
        result = match("Glycomet")
        assert result.level == "AUTO"
        assert "metformin" in result.entry.generic.lower()

    @pytest.mark.parametrize("name", ["Tiotropium", "Nintedanib", "Sumatriptan", "Zolpidem"])
    def test_a_real_medicine_the_catalogue_lacks_matches_nothing(self, name):
        assert match(name).level == "NONE"

    @pytest.mark.parametrize(
        ("absent", "lookalike"),
        [
            ("Rosiglitazone", "pioglitazone"),
            ("Lamotrigine", "famotidine"),
            ("Pirfenidone", "propafenone"),
        ],
    )
    def test_a_near_neighbour_is_never_applied_automatically(self, absent, lookalike):
        """Rosiglitazone and pioglitazone are both diabetes drugs; treating one
        as the other would silently attach the wrong strength and category.
        The worst allowed outcome is a suggestion the patient must confirm."""
        result = match(absent)
        assert result.level != "AUTO"
        if result.entry is not None:
            assert result.score < matcher.AUTO_THRESHOLD

    def test_common_everyday_medicines_are_in_the_catalogue(self):
        """The catalogue is not limited to the six chronic-disease groups;
        without paracetamol the OCR pipeline would miss the most prescribed drug."""
        for name in ("Paracetamol", "Ibuprofen", "Omeprazole", "Pantoprazole", "Cetirizine"):
            assert match(name).level == "AUTO", name

    def test_gibberish_matches_nothing(self):
        assert match("Xqzvtklw").level == "NONE"

    def test_an_empty_name_matches_nothing(self):
        assert match("").level == "NONE"
        assert match("   ").level == "NONE"

    def test_a_one_drug_query_does_not_fully_match_a_combination(self):
        """Metformin alone must not resolve to 'Alogliptin / Metformin'."""
        result = match("Metformin")
        assert "/" not in result.entry.generic

    def test_a_combination_query_finds_the_combination(self):
        result = match("Alogliptin + Metformin")
        assert result.entry is not None
        assert "alogliptin" in result.entry.generic.lower()
        assert "metformin" in result.entry.generic.lower()


class TestPresentationChoice:
    def test_the_strength_picks_the_right_presentation(self):
        result = match("Metformin", strength="500", unit="mg", form="Tablet")
        assert result.entry.strength == "500"
        assert "tablet" in result.entry.form.lower()

    def test_a_different_strength_picks_a_different_row(self):
        five, ten = match("Amlodipine", strength="5", unit="mg"), match(
            "Amlodipine", strength="10", unit="mg"
        )
        assert five.entry.strength == "5"
        assert ten.entry.strength == "10"
        assert five.entry.id != ten.entry.id

    def test_the_form_is_used_to_break_a_tie(self):
        capsule = match("Amoxicillin", strength="500", unit="mg", form="Capsule")
        assert "capsule" in capsule.entry.form.lower()

    def test_the_plain_presentation_beats_an_extended_release_one(self):
        result = match("Metformin", strength="500", unit="mg", form="Tablet")
        assert "extended" not in result.entry.form.lower()


class TestAlternatives:
    def test_a_possible_match_offers_other_candidates(self):
        result = match("Metforminx")
        assert result.entry is not None
        assert isinstance(result.alternatives, list)
        assert len(result.alternatives) <= 3

    def test_alternatives_are_different_drugs_not_repeats(self):
        result = match("Amlodipine")
        generics = [result.entry.generic.lower()] + [a.generic.lower() for a in result.alternatives]
        assert len(generics) == len(set(generics))


class TestLevels:
    def test_levels(self):
        entry = Entry("1", "Metformin", "", "500", "mg", "Tablet", "DIABETES")
        assert MatchResult(entry, 0.95).level == "AUTO"
        assert MatchResult(entry, 0.75).level == "POSSIBLE"
        assert MatchResult(None, 0.0).level == "NONE"
