"""The real OCR engine, on a rendered prescription.

Skipped where the Tesseract binary is not installed (a plain laptop checkout);
it runs in the backend Docker image and in CI, where it is. The rest of the OCR
tests use a fake engine precisely so they do not depend on this.

The image is synthetic: clean printed text drawn with Pillow. That proves the
whole chain - preprocessing, Tesseract, parser, matcher - works on a real
engine's output, including its quirks. It says nothing about photographs taken
at an angle in poor light, or about handwriting; see docs/testing-report.md.
"""

from __future__ import annotations

import shutil

import pytest
from PIL import Image, ImageDraw, ImageFont

from apps.ocr.services import engines, parser, preprocess

pytestmark = pytest.mark.skipif(
    shutil.which("tesseract") is None, reason="the tesseract binary is not installed"
)

LINES = [
    "Dr. Meera Iyer",
    "City Care Clinic",
    "Date: 12/03/2026",
    "Rx",
    "1. Tab Metformin 500 mg 1-0-1 x 30 days",
    "2. Tab Amlodipine 5 mg 0-0-1 x 30 days",
]


def render(lines, size=34, width=1500, noise=False) -> Image.Image:
    font = ImageFont.load_default(size=size)
    image = Image.new("RGB", (width, 60 + len(lines) * (size + 26)), "white")
    draw = ImageDraw.Draw(image)
    for i, line in enumerate(lines):
        draw.text((40, 30 + i * (size + 26)), line, fill="black", font=font)
    if noise:
        image = image.rotate(1.5, expand=True, fillcolor="white")
    return image


def read(image):
    return engines.TesseractEngine().read(preprocess.prepare(image))


def test_it_reads_a_printed_prescription_and_the_parser_understands_it():
    result = read(render(LINES))

    assert result.engine == "tesseract"
    assert result.confidence is not None and result.confidence > 0.6

    parsed = parser.parse_prescription_text(result.text)
    names = [m.name.lower() for m in parsed.medicines]
    assert any("metformin" in n for n in names), result.text
    assert any("amlodipine" in n for n in names), result.text

    metformin = next(m for m in parsed.medicines if "metformin" in m.name.lower())
    assert metformin.strength == "500"
    assert {s.slot for s in metformin.slots} == {
        "MORNING",
        "NIGHT",
    }  # 1-0-1: morning, afternoon, night


def test_a_slightly_skewed_scan_still_reads():
    result = read(render(LINES, noise=True))
    parsed = parser.parse_prescription_text(result.text)
    assert any("metformin" in m.name.lower() for m in parsed.medicines), result.text


def test_a_blank_page_yields_no_medicines_rather_than_invented_ones():
    result = read(Image.new("RGB", (800, 600), "white"))
    assert parser.parse_prescription_text(result.text).medicines == []


def test_an_unusable_binary_path_is_reported_as_unavailable(settings):
    settings.TESSERACT_CMD = "/no/such/tesseract"
    with pytest.raises(engines.OCRUnavailable):
        read(render(LINES[:1]))
