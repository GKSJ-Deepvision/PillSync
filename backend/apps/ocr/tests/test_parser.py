from apps.ocr.services.parser import parse_ocr_text

def test_parse_empty_text():
    result = parse_ocr_text("")
    assert result["medicine_name"] is None
    assert result["dosage"] is None
    assert result["quantity"] is None
    assert result["frequency"] is None
    assert result["prescription_details"] is None

def test_parse_basic_prescription():
    text = """
    PRESCRIPTION
    Rx: Lisinopril 10mg
    Take once daily
    Quantity: 30
    """
    result = parse_ocr_text(text)
    assert result["medicine_name"] == "Lisinopril"
    assert result["dosage"] == "10mg"
    assert result["quantity"] == 30
    assert result["frequency"] == "DAILY"
    assert "Lisinopril 10mg" in result["prescription_details"]

def test_parse_variations_1():
    text = """
    Amoxicillin 500 mg
    1-1-1
    Qty 21
    """
    result = parse_ocr_text(text)
    assert result["medicine_name"] == "Amoxicillin"
    assert result["dosage"] == "500 mg"
    assert result["quantity"] == 21
    assert result["frequency"] == "THREE_TIMES_DAILY"

def test_parse_variations_2():
    text = """
    Patient: John Doe
    Rx CoughSyrup 10 ml
    Take twice a day
    #1
    """
    result = parse_ocr_text(text)
    assert result["medicine_name"] == "CoughSyrup"
    assert result["dosage"] == "10 ml"
    assert result["quantity"] == 1
    assert result["frequency"] == "TWICE_DAILY"

def test_parse_variations_3():
    text = """
    Vitamin D3 50mcg
    OD
    30 tablets
    """
    result = parse_ocr_text(text)
    assert result["medicine_name"] == "Vitamin D3"
    assert result["dosage"] == "50mcg"
    assert result["quantity"] == 30
    assert result["frequency"] == "DAILY"

def test_missing_fields():
    text = """
    Just some random doctor notes.
    Blood pressure looks good.
    """
    result = parse_ocr_text(text)
    assert result["medicine_name"] is None
    assert result["dosage"] is None
    assert result["quantity"] is None
    assert result["frequency"] is None
