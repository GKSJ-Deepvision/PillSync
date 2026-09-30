"""The prescription parser, against the layouts real prescriptions use.

Pure functions, no database: these run in milliseconds, so the suite can afford
to be wide. Each case is a realistic line or page, because the failure mode
here is not a crash but a confident wrong answer - a medicine read as twice a
day when it says once.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from apps.common.choices import DoseSlot
from apps.ocr.services import parser
from apps.ocr.services.parser import (
    AFTERNOON,
    EVENING,
    MORNING,
    NIGHT,
    parse_medicine_label,
    parse_prescription_text,
)


def only(text: str):
    result = parse_prescription_text(text)
    assert len(result.medicines) == 1, [m.raw_line for m in result.medicines]
    return result.medicines[0]


def slots_of(medicine) -> list[tuple[str, Decimal]]:
    return [(s.slot, s.quantity) for s in medicine.slots]


def test_slot_constants_match_the_django_choices():
    """The parser avoids importing Django, so this is the guard against drift."""
    assert (MORNING, AFTERNOON, EVENING, NIGHT) == (
        DoseSlot.MORNING,
        DoseSlot.AFTERNOON,
        DoseSlot.EVENING,
        DoseSlot.NIGHT,
    )


class TestFrequencyNotations:
    def test_the_three_part_notation(self):
        m = only("Tab. Metformin 500 mg 1-0-1 x 30 days")
        assert slots_of(m) == [(MORNING, Decimal(1)), (NIGHT, Decimal(1))]

    def test_all_three_slots(self):
        m = only("Cap Amoxicillin 500mg 1-1-1 for 5 days")
        assert [s.slot for s in m.slots] == [MORNING, AFTERNOON, NIGHT]

    def test_night_only(self):
        m = only("Tab Atorvastatin 20 mg 0-0-1")
        assert slots_of(m) == [(NIGHT, Decimal(1))]

    def test_different_quantities_per_slot_are_kept(self):
        """2-0-1 means two in the morning and one at night, not three a day."""
        m = only("Tab Prednisolone 5 mg 2-0-1")
        assert slots_of(m) == [(MORNING, Decimal(2)), (NIGHT, Decimal(1))]

    def test_fractions(self):
        m = only("Tab Warfarin 5 mg 1/2-0-1/2")
        assert slots_of(m) == [(MORNING, Decimal("0.5")), (NIGHT, Decimal("0.5"))]

    def test_the_four_part_notation_adds_evening(self):
        m = only("Tab Paracetamol 500 mg 1-1-1-1")
        assert [s.slot for s in m.slots] == [MORNING, AFTERNOON, EVENING, NIGHT]

    def test_ocr_misreads_of_the_digits_are_tolerated(self):
        """A '1' is very often read as 'l' or 'I' and a '0' as 'O'."""
        m = only("Tab Metformin 500 mg l-O-I")
        assert slots_of(m) == [(MORNING, Decimal(1)), (NIGHT, Decimal(1))]

    @pytest.mark.parametrize(
        ("abbreviation", "expected"),
        [
            ("OD", [MORNING]),
            ("once daily", [MORNING]),
            ("BD", [MORNING, NIGHT]),
            ("BID", [MORNING, NIGHT]),
            ("twice a day", [MORNING, NIGHT]),
            ("TDS", [MORNING, AFTERNOON, NIGHT]),
            ("thrice daily", [MORNING, AFTERNOON, NIGHT]),
            ("three times a day", [MORNING, AFTERNOON, NIGHT]),
            ("QID", [MORNING, AFTERNOON, EVENING, NIGHT]),
            ("HS", [NIGHT]),
            ("at bedtime", [NIGHT]),
        ],
    )
    def test_abbreviations(self, abbreviation, expected):
        m = only(f"Tab Ramipril 5 mg {abbreviation}")
        assert [s.slot for s in m.slots] == expected

    def test_once_daily_with_no_time_says_it_assumed_morning(self):
        m = only("Tab Levothyroxine 25 mcg OD")
        assert [s.slot for s in m.slots] == [MORNING]
        assert any("morning was assumed" in r for r in m.reasons)

    def test_once_daily_at_night_is_not_assumed(self):
        m = only("Tab Atorvastatin 10 mg OD at night")
        assert [s.slot for s in m.slots] == [NIGHT]
        assert not any("assumed" in r for r in m.reasons)

    def test_every_eight_hours(self):
        m = only("Cap Amoxicillin 500 mg every 8 hours")
        assert len(m.slots) == 3

    def test_an_interval_that_does_not_fit_the_slots_is_flagged(self):
        m = only("Tab Ibuprofen 400 mg every 5 hours")
        assert any("does not map cleanly" in r for r in m.reasons)

    def test_named_times_of_day(self):
        m = only("Tab Aspirin 75 mg 1 tab morning and night")
        assert [s.slot for s in m.slots] == [MORNING, NIGHT]

    def test_as_needed_medicines_get_no_schedule(self):
        m = only("Tab Paracetamol 650 mg SOS")
        assert m.as_needed
        assert m.slots == []
        assert not any("No dose times" in r for r in m.reasons)

    def test_a_missing_frequency_is_flagged_not_guessed(self):
        m = only("Tab Cetirizine 10 mg")
        assert m.slots == []
        assert any("No dose times" in r for r in m.reasons)


class TestQuantityPerDose:
    def test_two_tablets_twice_a_day(self):
        m = only("Tab Paracetamol 500 mg 2 tabs BD")
        assert slots_of(m) == [(MORNING, Decimal(2)), (NIGHT, Decimal(2))]

    def test_half_a_tablet(self):
        m = only("Tab Warfarin 5 mg 1/2 tab OD")
        assert slots_of(m) == [(MORNING, Decimal("0.5"))]

    def test_a_liquid_dose_in_millilitres(self):
        m = only("Syp Cough Relief 5 ml TDS")
        assert m.form == "Syrup"
        assert [s.quantity for s in m.slots] == [Decimal(5)] * 3
        # 5 ml is the dose, not a strength.
        assert m.strength == ""

    def test_the_strength_is_not_mistaken_for_the_dose(self):
        m = only("Tab Metformin 500 mg BD")
        assert m.strength == "500"
        assert [s.quantity for s in m.slots] == [Decimal(1), Decimal(1)]


class TestStrength:
    @pytest.mark.parametrize(
        ("text", "number", "unit"),
        [
            ("Tab Amlodipine 5mg OD", "5", "mg"),
            ("Tab Levothyroxine 25 mcg OD", "25", "mcg"),
            ("Tab Levothyroxine 25 µg OD", "25", "ug"),
            ("Tab Vitamin D3 60000 IU weekly", "60000", "iu"),
            ("Tab Metformin 0.5 g BD", "0.5", "g"),
            ("Syp Amoxicillin 250mg/5ml TDS", "250", "mg/5mL"),
            ("Tab Amoxicillin/Clavulanate 500/125 mg BD", "500/125", "mg"),
            ("Inj Insulin 100 units/ml OD", "100", "units/mL"),
        ],
    )
    def test_strength_and_unit(self, text, number, unit):
        m = only(text)
        assert (m.strength, m.strength_unit) == (number, unit)

    def test_a_brand_number_with_no_unit_is_a_strength_flagged_for_review(self):
        m = only("Tab Dolo 650 1-0-1")
        assert m.name == "Dolo"
        assert m.strength == "650"
        assert any("no unit" in r for r in m.reasons)


class TestDurationAndQuantity:
    @pytest.mark.parametrize(
        ("text", "days"),
        [
            ("Tab Amoxicillin 500 mg TDS x 5 days", 5),
            ("Tab Amoxicillin 500 mg TDS x5d", 5),
            ("Tab Amoxicillin 500 mg TDS for 7 days", 7),
            ("Tab Amoxicillin 500 mg TDS for 2 weeks", 14),
            ("Tab Metformin 500 mg BD for 1 month", 30),
            ("Tab Metformin 500 mg BD 10 days", 10),
        ],
    )
    def test_duration(self, text, days):
        assert only(text).duration_days == days

    def test_no_duration_means_ongoing(self):
        assert only("Tab Amlodipine 5 mg OD").duration_days is None

    def test_total_quantity_is_worked_out_from_the_course_and_says_so(self):
        m = only("Cap Amoxicillin 500 mg 1-1-1 for 5 days")
        assert m.total_quantity == Decimal(15)
        assert any("worked out" in r for r in m.reasons)

    def test_a_printed_quantity_wins_over_the_arithmetic(self):
        m = only("Cap Amoxicillin 500 mg 1-1-1 for 5 days #20")
        assert m.total_quantity == Decimal(20)
        assert not any("worked out" in r for r in m.reasons)

    @pytest.mark.parametrize("marker", ["Qty: 30", "qty 30", "Disp: 30", "#30"])
    def test_quantity_markers(self, marker):
        assert only(f"Tab Metformin 500 mg BD {marker}").total_quantity == Decimal(30)

    def test_a_dose_count_is_not_mistaken_for_the_total(self):
        m = only("Tab Paracetamol 500 mg 2 tabs BD for 3 days")
        assert m.total_quantity == Decimal(12)


class TestInstructions:
    @pytest.mark.parametrize(
        ("suffix", "expected"),
        [
            ("after food", "After food"),
            ("before meals", "Before food"),
            ("empty stomach", "On an empty stomach"),
            ("with water", "With water"),
            ("PC", "After food"),
            ("AC", "Before food"),
        ],
    )
    def test_instructions(self, suffix, expected):
        assert expected in only(f"Tab Metformin 500 mg BD {suffix}").instructions

    def test_lowercase_ac_inside_a_word_is_not_an_instruction(self):
        """'ac' and 'pc' are ordinary letters; only the uppercase forms count."""
        assert only("Tab Pacitane 2 mg BD").instructions == ""


class TestNames:
    def test_the_form_prefix_is_split_off(self):
        m = only("Tab. Metformin Hydrochloride 500 mg BD")
        assert (m.form, m.name) == ("Tablet", "Metformin Hydrochloride")

    @pytest.mark.parametrize("prefix", ["Tab", "Tab.", "TAB", "tablet", "T."])
    def test_prefix_variants(self, prefix):
        result = parse_prescription_text(f"{prefix} Amlodipine 5 mg OD")
        assert result.medicines
        assert result.medicines[0].name == "Amlodipine"
        assert result.medicines[0].form == "Tablet"

    def test_a_bare_t_is_not_a_tablet_marker(self):
        """T3 and T4 are thyroid hormones, not 'Tab'."""
        result = parse_prescription_text("T4 level 8.2 ug/dL")
        assert result.medicines == []

    def test_capsules_and_injections(self):
        assert only("Cap Omeprazole 20 mg OD").form == "Capsule"
        assert only("Inj Enoxaparin 40 mg OD").form == "Injection"

    def test_a_numbered_list_prefix_is_removed(self):
        m = only("1. Tab Metformin 500 mg BD")
        assert m.name == "Metformin"

    def test_an_all_caps_name_is_made_readable(self):
        assert only("Tab METFORMIN 500 mg BD").name == "Metformin"

    def test_trailing_punctuation_is_stripped(self):
        assert only("Tab Amlodipine, 5 mg OD").name == "Amlodipine"


class TestPageLayouts:
    PAGE = """
    Sunrise Family Clinic
    Dr. Anil Mehta MBBS MD
    Reg No: MCI-45821
    Date: 05/09/2026
    Name: Asha Patel     Age: 34   Sex: F
    BP: 130/85   Wt: 62 kg

    Rx
    1. Tab. Metformin 500 mg  1-0-1  x 30 days  (after food)
    2. Tab. Amlodipine 5mg  1-0-0  x 30 days
    3. Cap Amoxicillin 500 mg TDS for 5 days
    4. Syp Cough Relief 5 ml BD

    Advice: plenty of fluids
    Follow up after 1 month
    Valid for 30 days
    """

    def test_the_header_is_read(self):
        header = parse_prescription_text(self.PAGE).header
        assert header.doctor_name == "Dr Anil Mehta"
        assert header.clinic_name == "Sunrise Family Clinic"
        assert header.patient_name == "Asha Patel"
        assert header.issued_on == date(2026, 9, 5)

    def test_validity_is_counted_from_the_issue_date(self):
        assert parse_prescription_text(self.PAGE).header.expires_on == date(2026, 10, 5)

    def test_all_four_medicines_and_nothing_else_are_found(self):
        result = parse_prescription_text(self.PAGE)
        assert [m.name for m in result.medicines] == [
            "Metformin",
            "Amlodipine",
            "Amoxicillin",
            "Cough Relief",
        ]

    def test_vitals_and_advice_are_not_read_as_medicines(self):
        names = " ".join(m.name for m in parse_prescription_text(self.PAGE).medicines)
        for stray in ("BP", "Wt", "Advice", "Follow"):
            assert stray not in names

    def test_the_first_medicine_is_complete(self):
        m = parse_prescription_text(self.PAGE).medicines[0]
        assert (m.strength, m.strength_unit) == ("500", "mg")
        assert [s.slot for s in m.slots] == [MORNING, NIGHT]
        assert m.duration_days == 30
        assert m.total_quantity == Decimal(60)
        assert m.instructions == "After food"

    def test_a_frequency_on_the_next_line_belongs_to_the_medicine_above(self):
        text = "Tab Metformin 500 mg\n   1-0-1 x 30 days after food"
        m = only(text)
        assert [s.slot for s in m.slots] == [MORNING, NIGHT]
        assert m.duration_days == 30

    def test_lines_after_an_rx_marker_are_medicines_even_without_a_strength(self):
        result = parse_prescription_text("Rx\nTab Cetirizine BD\nTab Pantoprazole OD")
        assert [m.name for m in result.medicines] == ["Cetirizine", "Pantoprazole"]

    def test_empty_text_yields_a_warning_not_an_error(self):
        result = parse_prescription_text("")
        assert result.medicines == []
        assert result.warnings

    def test_a_page_with_no_medicines_yields_a_warning(self):
        result = parse_prescription_text("Sunrise Clinic\nDate: 05/09/2026\nFollow up in 2 weeks")
        assert result.medicines == []
        assert "No medicines" in result.warnings[0]


class TestDates:
    @pytest.mark.parametrize(
        ("text", "expected"),
        [
            ("05/09/2026", date(2026, 9, 5)),
            ("5-9-26", date(2026, 9, 5)),
            ("05.09.2026", date(2026, 9, 5)),
            ("2026-09-05", date(2026, 9, 5)),
            ("5 Sep 2026", date(2026, 9, 5)),
            ("05 September 2026", date(2026, 9, 5)),
            ("Sep 5, 2026", date(2026, 9, 5)),
            ("13/09/2026", date(2026, 9, 13)),
            ("09/13/2026", date(2026, 9, 13)),  # only readable as month-first
        ],
    )
    def test_formats(self, text, expected):
        assert parser.parse_date(text) == expected

    def test_an_impossible_date_is_none(self):
        assert parser.parse_date("31/02/2026") is None

    def test_no_date_is_none(self):
        assert parser.parse_date("Tab Metformin 500 mg") is None

    def test_a_date_is_never_read_as_a_frequency(self):
        """12-09-2026 has the shape of a 1-0-1 triple."""
        result = parse_prescription_text("Tab Metformin 500 mg OD\nDate 12-09-2026")
        assert [s.slot for s in result.medicines[0].slots] == [MORNING]


class TestHeaderRobustness:
    def test_doctor_qualifications_are_not_part_of_the_name(self):
        header = parse_prescription_text("Dr. S. Rao MBBS, MD (Medicine)").header
        assert header.doctor_name == "Dr S. Rao"

    def test_the_doctors_registration_number_is_not_the_prescription_reference(self):
        header = parse_prescription_text("Reg. No: MCI-45821").header
        assert header.reference_number == ""

    def test_a_prescription_number_is_captured(self):
        header = parse_prescription_text("Rx No: RX-2026-0042").header
        assert header.reference_number == "RX-2026-0042"

    def test_an_explicit_expiry_date(self):
        header = parse_prescription_text("Date: 01/09/2026\nValid till 30/11/2026").header
        assert header.expires_on == date(2026, 11, 30)


class TestNoSilentLoss:
    """The worst failure is a medicine quietly dropped or mis-scheduled."""

    def test_two_medicines_on_one_line_are_both_found(self):
        result = parse_prescription_text("Tab Metformin 500 mg BD Tab Glimepiride 1 mg OD")
        assert [m.name for m in result.medicines] == ["Metformin", "Glimepiride"]
        assert [s.slot for s in result.medicines[1].slots] == [MORNING]

    def test_a_numbered_list_is_not_split_at_the_number(self):
        result = parse_prescription_text("1. Tab Metformin 500 mg BD\n2. Tab Amlodipine 5 mg OD")
        assert [m.name for m in result.medicines] == ["Metformin", "Amlodipine"]

    def test_a_dose_count_before_a_form_word_does_not_split_the_line(self):
        """'1 tab' is a quantity, not the start of another medicine."""
        result = parse_prescription_text("Tab Paracetamol 500 mg 1 tab TDS")
        assert len(result.medicines) == 1

    def test_weekly_dosing_is_recognised_not_dropped(self):
        m = only("Tab Alendronate 70 mg once weekly")
        assert (m.frequency, m.interval_days) == ("INTERVAL", 7)
        assert [s.slot for s in m.slots] == [MORNING]
        assert any("once a week" in r for r in m.reasons)

    def test_a_weekly_course_counts_doses_not_days(self):
        m = only("Tab Methotrexate 2.5 mg 4 tabs once weekly x 4 weeks")
        assert m.total_quantity == Decimal(16)  # 4 tablets on each of 4 weeks

    def test_alternate_days(self):
        m = only("Tab Prednisolone 10 mg alternate days")
        assert (m.frequency, m.interval_days) == ("INTERVAL", 2)

    def test_named_weekdays(self):
        m = only("Tab Methotrexate 2.5 mg on Monday and Thursday")
        assert m.frequency == "SPECIFIC_DAYS"
        assert m.days_of_week == [1, 4]

    def test_a_clinic_called_sunrise_is_not_a_weekday(self):
        header = parse_prescription_text("Sunrise Family Clinic").header
        assert header.clinic_name == "Sunrise Family Clinic"

    def test_a_daily_medicine_stays_daily(self):
        m = only("Tab Metformin 500 mg BD")
        assert (m.frequency, m.interval_days, m.days_of_week) == ("DAILY", 1, [])


class TestOcrNoise:
    def test_look_alike_digits_in_the_strength_and_duration(self):
        m = only("Tab. Metformin 5OO mg 1-O-1 x 3O days")
        assert (m.strength, m.strength_unit) == ("500", "mg")
        assert m.duration_days == 30
        assert m.name == "Metformin"

    def test_a_zero_inside_a_long_word_is_a_misread_letter(self):
        assert only("Tab Metf0rmin 500 mg BD").name == "Metformin"

    def test_short_tokens_with_digits_are_left_alone(self):
        """D3 and B12 are real names, not damaged ones."""
        assert only("Tab Vitamin D3 60000 IU weekly").name == "Vitamin D3"
        assert only("Tab Vitamin B12 1500 mcg OD").name == "Vitamin B12"

    def test_a_word_made_only_of_lookalike_letters_is_not_turned_into_digits(self):
        assert "1" not in only("Tab Ill-defined 5 mg OD").name

    def test_stray_pipes_from_a_ruled_form(self):
        m = only("| Tab. Amlodipine 5 mg | OD ~ x 30 d")
        assert m.name == "Amlodipine"
        assert m.duration_days == 30

    def test_a_pipe_beside_a_hyphen_is_a_misread_one(self):
        m = only("Tab Metformin 500 mg |-0-|")
        assert [s.slot for s in m.slots] == [MORNING, NIGHT]

    def test_spaced_and_em_dashes(self):
        assert len(only("Tab Metformin 500 mg 1 - 0 - 1").slots) == 2
        assert len(only("Tab Metformin 500 mg 1—0—1").slots) == 2

    def test_lowercase_input(self):
        m = only("tab metformin 500mg bd after food x 30 days")
        assert (m.name, m.strength, m.duration_days) == ("Metformin", "500", 30)


class TestDosesAndQualifiers:
    def test_units_of_insulin_are_a_dose_not_a_strength(self):
        m = only("Inj Insulin glargine 20 units at bedtime")
        assert m.strength == ""
        assert slots_of(m) == [(NIGHT, Decimal(20))]

    def test_an_insulin_concentration_is_a_strength(self):
        m = only("Inj Insulin 100 units/ml 10 units OD")
        assert (m.strength, m.strength_unit) == ("100", "units/mL")

    def test_eye_drops(self):
        m = only("Eye drops Timolol 0.5% 1 drop BD")
        assert (m.name, m.form) == ("Timolol", "Eye Drops")
        assert (m.strength, m.strength_unit) == ("0.5", "%")


class TestMedicineLabels:
    def test_a_box(self):
        text = "AMLODIPINE TABLETS IP 5 mg\nEach film coated tablet contains 5 mg\nBatch No. A123\nEXP 08/2099\n10 tablets"
        result = parse_medicine_label(text)
        m = result.medicines[0]
        assert m.name == "Amlodipine"
        assert m.form == "Tablet"
        assert (m.strength, m.strength_unit) == ("5", "mg")
        assert m.total_quantity == Decimal(10)
        assert result.header.expires_on == date(2099, 8, 31)

    def test_a_box_has_no_schedule_and_says_so(self):
        m = parse_medicine_label("Metformin Tablets 500 mg\n10 tablets").medicines[0]
        assert m.slots == []
        assert any("no dosing instructions" in r for r in m.reasons)

    def test_an_expired_box_raises_a_warning(self):
        result = parse_medicine_label("Metformin Tablets 500 mg\nEXP 01/2020")
        assert any("expired" in w for w in result.warnings)

    def test_a_current_box_raises_no_warning(self):
        result = parse_medicine_label("Metformin Tablets 500 mg\nEXP 12/2099")
        assert result.warnings == []

    def test_unreadable_text_is_a_warning(self):
        assert parse_medicine_label("").medicines == []

    def test_month_names_in_the_expiry(self):
        result = parse_medicine_label("Metformin Tablets 500 mg\nExp: Dec 2099")
        assert result.header.expires_on == date(2099, 12, 31)


class TestFormAfterTheStrength:
    """Found by the OCR evaluation (ml/src/ocr/evaluate.py), not by imagining cases.

    "Metformin 500mg tablet twice daily" was split in two at the word "tablet",
    because a form word normally starts a new medicine. The frequency ended up in
    a nameless fragment and was dropped, so the medicine was added with no dose
    times - and therefore no reminders.
    """

    @pytest.mark.parametrize(
        ("line", "per_day", "days"),
        [
            ("Neomycin 500mg tablet twice daily for 30 days", 2, 30),
            ("1) Neomycin 500mg tablet twice daily for 30 days", 2, 30),
            ("Neomycin 500mg tablet once daily for 10 days", 1, 10),
            ("Neomycin 500mg tablet thrice daily for 5 days", 3, 5),
            ("Neomycin 500 mg capsule twice daily for 7 days", 2, 7),
            ("Neomycin 500mg tablet after food BD x 14 days", 2, 14),
            ("Neomycin 500mg tablet at bedtime x 14 days", 1, 14),
            ("Neomycin 500mg tablet every 8 hours for 5 days", 3, 5),
        ],
    )
    def test_the_frequency_is_kept(self, line, per_day, days):
        medicine = only(f"Rx\n{line}")
        assert medicine.name == "Neomycin"
        assert medicine.strength == "500"
        assert medicine.doses_per_day == per_day
        assert medicine.duration_days == days

    def test_the_trailing_form_is_recorded(self):
        assert only("Rx\nNeomycin 500mg tablet twice daily for 7 days").form == "Tablet"
        assert only("Rx\nNeomycin 500mg capsule twice daily for 7 days").form == "Capsule"

    def test_a_leading_form_still_wins(self):
        assert only("Rx\nCap. Neomycin 500mg tablet BD x 7 days").form == "Capsule"

    def test_genuinely_run_together_medicines_still_split(self):
        result = parse_prescription_text("Rx\nTab Metformin 500 mg BD Tab Amlodipine 5 mg OD")
        assert [m.name for m in result.medicines] == ["Metformin", "Amlodipine"]

    def test_a_form_word_before_a_drug_name_still_splits(self):
        result = parse_prescription_text("Rx\nMetformin 500 mg BD tablet Amlodipine 5 mg OD")
        assert [m.name for m in result.medicines] == ["Metformin", "Amlodipine"]
