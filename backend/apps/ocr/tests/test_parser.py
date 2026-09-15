from apps.ocr.services.parser import parse_prescription_text


def test_parse_prescription_line_into_medicine_fields():
    medicines = parse_prescription_text("Amoxicillin 500 mg, twice daily, Qty: 14", 0.87)

    assert len(medicines) == 1
    assert medicines[0].name == "Amoxicillin"
    assert medicines[0].dosage == "500 mg"
    assert medicines[0].quantity == "14"
    assert medicines[0].frequency == "twice daily"