from apps.ocr.services import parse_fields


def test_parse_fields_extracts_dosage():
    text = "Paracetamol\n500mg\nTake twice daily"
    fields = parse_fields(text)
    assert fields["dosage"].lower().replace(" ", "") == "500mg"


def test_parse_fields_extracts_medicine_name_as_first_meaningful_line():
    text = "Amoxicillin\n250mg\nQTY: 21 capsules\nTake three times daily"
    fields = parse_fields(text)
    assert fields["medicine_name"] == "Amoxicillin"


def test_parse_fields_extracts_quantity():
    text = "Ibuprofen\n400mg\nQTY: 30 tablets"
    fields = parse_fields(text)
    assert "30" in fields["quantity"]
    assert "tablet" in fields["quantity"].lower()


def test_parse_fields_extracts_frequency():
    text = "Metformin\n500mg\nTake twice daily with food"
    fields = parse_fields(text)
    assert "twice" in fields["frequency"].lower()


def test_parse_fields_handles_empty_text_gracefully():
    fields = parse_fields("")
    assert fields["medicine_name"] == ""
    assert fields["dosage"] == ""
    assert fields["quantity"] == ""
    assert fields["frequency"] == ""


def test_parse_fields_skips_pure_numeric_lines_when_finding_name():
    text = "12345\n500mg\nCetirizine\nOnce daily"
    fields = parse_fields(text)
    assert fields["medicine_name"] == "Cetirizine"
