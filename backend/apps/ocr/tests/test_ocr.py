from ml.src.ocr.recognizer import OCRRecognizer


def test_ocr_recognizer_extraction():
    res = OCRRecognizer.extract_prescription_text("Rx: Metformin 500mg 60 tablets")
    assert res["medicine_name"] == "Metformin"
    assert res["dosage"] == "500mg"
    assert res["confidence"] > 0.9
