from app.services.medicine_extraction import (
    extract_frequency,
    extract_medicine_information,
    extract_quantity,
    extract_dosage,
)


def test_extract_dosage():
    text = "Paracetamol 500 mg"

    assert extract_dosage(text) == "500 mg"


def test_extract_quantity():
    text = "Quantity: 10 tablets"

    assert extract_quantity(text) == 10


def test_extract_frequency():
    text = "Take 1 tablet twice daily"

    assert extract_frequency(text) == "twice daily"


def test_extract_medicine_information():
    text = """
    Paracetamol
    Tablets IP
    500 mg
    Take 1 tablet twice daily
    Quantity: 10 tablets
    """

    result = extract_medicine_information(text)

    assert result["medicine_name"] == "Paracetamol"
    assert result["dosage"] == "500 mg"
    assert result["quantity"] == 10
    assert result["frequency"] == "twice daily"
    assert "Take 1 tablet twice daily" in result["prescription_details"]


def test_extract_medicine_without_quantity_or_frequency():
    text = """
    Paracetamol
    Tablets IP
    500 mg
    Analgesic and Antipyretic
    Relieves fever and mild to moderate pain
    For oral use
    """

    result = extract_medicine_information(text)

    assert result["medicine_name"] == "Paracetamol"
    assert result["dosage"] == "500 mg"
    assert result["quantity"] is None
    assert result["frequency"] is None
    assert result["prescription_details"] is not None