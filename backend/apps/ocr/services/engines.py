"""OCR engines.

The pipeline talks to an `OCREngine`, never to Tesseract directly, and the engine
class is chosen by the OCR_ENGINE setting. That gives three things:

* tests inject a fake engine and exercise the whole pipeline without the
  Tesseract binary installed;
* a hosted engine (Google Vision, Azure Document Intelligence) can be swapped in
  for handwritten prescriptions - which Tesseract is poor at - by writing one
  class and changing one setting;
* an environment with no Tesseract fails with an explanation, not a stack trace.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Protocol

from django.conf import settings
from django.utils.module_loading import import_string
from PIL import Image

logger = logging.getLogger(__name__)


class OCRUnavailable(Exception):
    """The engine cannot run here at all (binary missing, misconfigured)."""


class OCRFailed(Exception):
    """The engine ran and could not read the image (timeout, corrupt data)."""


@dataclass(frozen=True)
class OCRResult:
    text: str
    confidence: float | None  # mean word confidence, 0-1, or None if unknown
    engine: str


class OCREngine(Protocol):
    name: str

    def read(self, image: Image.Image) -> OCRResult: ...


class TesseractEngine:
    """Tesseract via pytesseract.

    Uses `image_to_data` rather than `image_to_string`, because the data form
    carries a confidence for every word. That confidence is what lets the review
    screen say "this line was hard to read" instead of presenting everything as
    equally trustworthy.
    """

    name = "tesseract"

    def __init__(self, lang: str = "eng", config: str = "--oem 3 --psm 6", timeout: int = 45):
        self.lang = lang
        self.config = config
        self.timeout = timeout

    def read(self, image: Image.Image) -> OCRResult:
        try:
            import pytesseract
            from pytesseract import Output
        except ImportError as exc:
            raise OCRUnavailable("The pytesseract package is not installed.") from exc

        if getattr(settings, "TESSERACT_CMD", ""):
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

        try:
            data = pytesseract.image_to_data(
                image,
                lang=self.lang,
                config=self.config,
                output_type=Output.DICT,
                timeout=self.timeout,
            )
        except pytesseract.TesseractNotFoundError as exc:
            raise OCRUnavailable(
                "Tesseract is not installed on this server. Install it, or set TESSERACT_CMD."
            ) from exc
        except RuntimeError as exc:  # pytesseract raises this on a timeout
            raise OCRFailed(f"Tesseract did not finish in {self.timeout}s.") from exc
        except pytesseract.TesseractError as exc:
            raise OCRFailed(f"Tesseract could not read the image: {exc}") from exc

        lines: dict[tuple[int, int, int], list[str]] = {}
        confidences: list[float] = []
        for i, word in enumerate(data["text"]):
            word = word.strip()
            if not word:
                continue
            key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
            lines.setdefault(key, []).append(word)
            conf = float(data["conf"][i])
            if conf >= 0:  # -1 marks layout elements, not words
                confidences.append(conf)

        text = "\n".join(" ".join(words) for _key, words in sorted(lines.items()))
        mean = sum(confidences) / len(confidences) / 100 if confidences else None
        return OCRResult(text=text, confidence=mean, engine=self.name)


def get_engine() -> OCREngine:
    return import_string(settings.OCR_ENGINE)()
