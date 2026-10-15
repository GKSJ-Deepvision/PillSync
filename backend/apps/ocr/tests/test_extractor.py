from io import BytesIO

from PIL import Image

from apps.ocr.services import extractor


def test_extractor_preserves_raw_ocr_text_when_no_medicine_matches(monkeypatch):
    image_buffer = BytesIO()
    Image.new("RGB", (100, 40), "white").save(image_buffer, format="PNG")
    raw_text = "Losartan 50 mg once daily"

    import pytesseract

    def no_medicine_matches(text, confidence, recognized_names):
        assert text == raw_text
        assert confidence == 0.64
        assert recognized_names == []
        return []

    def fake_image_to_string(image, config):
        assert image.size == (100, 40)
        assert config == "--psm 6"
        return raw_text

    def fake_image_to_data(image, config, output_type):
        assert image.size == (100, 40)
        assert config == "--psm 6"
        assert output_type == pytesseract.Output.DICT
        return {"conf": ["64"]}

    def no_detected_words(image):
        assert image.mode == "L"
        return []

    def configure_tesseract(module):
        assert module is pytesseract

    monkeypatch.setattr(extractor, "_recognize_detected_words", no_detected_words)
    monkeypatch.setattr(extractor, "_configure_tesseract", configure_tesseract)
    monkeypatch.setattr(extractor, "parse_prescription_text", no_medicine_matches)
    monkeypatch.setattr(pytesseract, "image_to_string", fake_image_to_string)
    monkeypatch.setattr(
        pytesseract,
        "image_to_data",
        fake_image_to_data,
    )

    result = extractor.extract_prescription(image_buffer.getvalue())

    assert result.text == ""
    assert result.raw_text == raw_text
    assert result.medicines == []
    assert result.confidence == 0.64
