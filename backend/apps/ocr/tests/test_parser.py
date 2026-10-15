from apps.ocr.services.parser import parse_prescription_text


def test_parse_prescription_line_into_medicine_fields():
    medicines = parse_prescription_text("Amoxicillin 500 mg, twice daily, Qty: 14", 0.87)

    assert len(medicines) == 1
    assert medicines[0].name == "Amoxicillin"
    assert medicines[0].dosage == "500 mg"
    assert medicines[0].quantity == "14"
    assert medicines[0].frequency == "twice daily"


def test_non_medicine_boilerplate_lines_are_dropped():
    """Regression test for the core "only add medicines" bug: previously the
    parser had no medicine-name filtering at all, so a doctor's letterhead
    ended up being returned as if it were a prescribed medicine."""
    text = "\n".join(
        [
            "Dr. K Verma",
            "MBBS, MD",
            "Rx",
            "Date: 12/05/2024",
            "Patient: John Doe",
        ]
    )

    medicines = parse_prescription_text(text, 0.8)

    assert medicines == []


def test_numeric_dosing_schedule_is_parsed_as_frequency():
    """Prescriptions commonly write dosing as morning-afternoon-night digits
    (e.g. "1-0-1") rather than words like "twice daily"."""
    medicines = parse_prescription_text("Tab Metformin 500mg 1-0-1", 0.8)

    assert len(medicines) == 1
    assert medicines[0].name == "Metformin"
    assert medicines[0].frequency == "1-0-1"


def test_ocr_noise_in_a_real_medicine_name_still_matches():
    """OCR misreads common letter shapes (e.g. "l" <-> "t", "o" <-> "0") --
    the fuzzy vocabulary match should still resolve these to the correct
    canonical medicine name rather than silently dropping the line."""
    medicines = parse_prescription_text("TabOmeprazcte 500mg 1-0-0", 0.7)

    assert len(medicines) == 1
    assert medicines[0].name == "Omeprazole"


def test_unrecognized_text_without_recognized_names_is_dropped():
    """A line that isn't in the medicine vocabulary and wasn't confirmed by
    one of the trained OCR models should not be reported as a medicine."""
    medicines = parse_prescription_text("Please review chart before signing", 0.9)

    assert medicines == []

