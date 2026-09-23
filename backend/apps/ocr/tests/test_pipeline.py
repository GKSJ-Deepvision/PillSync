"""End-to-end tests on the three sample images (printed table, pharmacy label, handwritten note)."""

import json
import pathlib

import pytest

from apps.ocr.engine.pipeline import scan_image, validate_upload
from apps.ocr.engine.vision import VisionError, normalize

FIX = pathlib.Path(__file__).parent / "fixtures"
read = lambda n: (FIX / n).read_bytes()

# What a vision model should return for handwritten_amoxicillin.png. This is a FIXTURE written by reading
# the image by eye - it tests our validation/routing, NOT the live model's accuracy (measure that separately).
HANDWRITTEN_MODEL_JSON = json.dumps(
    {
        "handwritten": True,
        "doctor": None,
        "prescription_date": "12-03-90",
        "expires_on": None,
        "refills_remaining": None,
        "medicines": [
            {
                "name": "amoxicillin",
                "brand_name": "Himox",
                "strength": "500 mg",
                "form": "cap",
                "units_per_dose": 1,
                "doses_per_day": 3,
                "times_of_day": [],
                "duration_days": 7,
                "quantity": 21,
                "as_needed": False,
                "food_instruction": None,
                "instructions_text": "1 cap 3X a day for seven days",
                "confidence": 0.9,
                "uncertain_fields": [],
            }
        ],
    }
)


def test_printed_table_prescription_reads_all_four_medicines():
    r = scan_image(read("printed_table.jpg"), use_vision=False)
    assert r["source"] == "tesseract" and r["handwriting_suspected"] is False
    assert [m["quantity"] for m in r["medicines"]] == [20, 20, 40, 10]
    assert [m["doses_per_day"] for m in r["medicines"]] == [2, 2, 4, 2]
    assert r["medicines"][3]["units_per_dose"] == 0.5  # "1/2 Morning, 1/2 Night"
    assert r["medicines"][0]["food_instruction"] == "before food"


def test_pharmacy_label_double_photo_merged_into_one_medicine():
    r = scan_image(read("pharmacy_label.jpg"), use_vision=False)
    assert r["medicine_count"] == 1
    m = r["medicines"][0]
    assert (m["name"], m["strength"], m["quantity"], m["times_of_day"]) == (
        "Atenolol",
        "100mg",
        30,
        ["night"],
    )
    assert r["expires_on"] == "3/19/2017" and r["refills_remaining"] == 3


def test_handwriting_is_detected_and_tesseract_result_not_trusted():
    r = scan_image(read("handwritten_amoxicillin.png"), use_vision=False)
    assert r["handwriting_suspected"] is True
    assert any("handwritten" in w for w in r["warnings"])
    assert r["needs_review"] is True


def test_handwriting_routed_to_vision_reader():
    calls = []

    def fake(img, media):
        calls.append(media)
        return HANDWRITTEN_MODEL_JSON

    r = scan_image(read("handwritten_amoxicillin.png"), vision_call=fake, use_vision=True)
    assert calls == ["image/png"] and r["source"] == "vision"
    m = r["medicines"][0]
    assert (m["name"], m["strength"], m["doses_per_day"], m["duration_days"], m["quantity"]) == (
        "Amoxicillin",
        "500mg",
        3,
        7,
        21,
    )
    assert m["needs_review"] is True  # handwriting always needs human confirmation
    assert not any("differs" in w for w in m["warnings"])  # 1 x 3 x 7 == 21


def test_clean_print_does_not_call_vision():
    def boom(*a):
        raise AssertionError("vision should not be called for clean printed text")

    scan_image(read("printed_table.jpg"), vision_call=boom, use_vision=True)


def test_vision_failure_falls_back_with_warning():
    def bad(img, media):
        return "sorry, I cannot help with that"

    r = scan_image(read("handwritten_amoxicillin.png"), vision_call=bad, use_vision=True)
    assert r["source"] == "tesseract" and any("Vision reader failed" in w for w in r["warnings"])


def test_misread_quantity_is_flagged_by_arithmetic_check():
    bad = json.loads(HANDWRITTEN_MODEL_JSON)
    bad["medicines"][0]["quantity"] = 27
    m = normalize(json.dumps(bad))["medicines"][0]
    assert any("differs" in w for w in m["warnings"]) and m["needs_review"]


def test_model_output_is_sanitised():
    weird = json.dumps(
        {
            "medicines": [
                {"name": "X", "doses_per_day": 999, "units_per_dose": "lots", "confidence": 0.2}
            ]
        }
    )
    m = normalize("```json\n" + weird + "\n```")["medicines"][0]
    assert m["doses_per_day"] is None and m["units_per_dose"] == 1.0 and m["needs_review"]


def test_json_without_medicines_rejected():
    with pytest.raises(VisionError):
        normalize('{"foo": 1}')


def test_upload_validation():
    with pytest.raises(ValueError):
        validate_upload(b"not an image")
    with pytest.raises(ValueError):
        validate_upload(b"0" * (11 * 1024 * 1024))
    assert validate_upload(read("printed_table.jpg")) == "image/jpeg"
