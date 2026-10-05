"""
Tesseract OCR Engine Integration for PillSync.
Handles dynamic executable resolution, dual-pass recognition,
confidence estimation, and structured raw text extraction.
"""

import os
import shutil
import logging
from typing import Dict, Any, List, Optional
from PIL import Image
import pytesseract
from pytesseract import Output

logger = logging.getLogger(__name__)

# Candidate Windows paths for Tesseract OCR executable
CANDIDATE_PATHS = [
    r"C:\Users\hp\tesseract-ocr\tesseract.exe",
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]


class OCREngineError(Exception):
    """Raised when Tesseract OCR engine encounters an unrecoverable failure."""
    pass


class OCREngine:
    """
    Production-ready wrapper for Tesseract OCR 5.4.
    """

    def __init__(self, tesseract_cmd: Optional[str] = None):
        self.tesseract_cmd = self._resolve_tesseract_path(tesseract_cmd)
        pytesseract.pytesseract.tesseract_cmd = self.tesseract_cmd
        self._version = self._detect_version()

    @staticmethod
    def _resolve_tesseract_path(override_path: Optional[str] = None) -> str:
        """
        Locates tesseract executable using environment, django settings, standard paths, or PATH.
        """
        # 1. Explicit override passed to constructor
        if override_path and os.path.isfile(override_path):
            return override_path

        # 2. Django settings or Environment variable
        env_path = os.environ.get('TESSERACT_CMD')
        if env_path and os.path.isfile(env_path):
            return env_path

        # Try to read from Django settings if loaded
        try:
            from django.conf import settings
            dj_path = getattr(settings, 'TESSERACT_CMD', None)
            if dj_path and os.path.isfile(dj_path):
                return dj_path
        except Exception:
            pass

        # 3. Known standard Windows installation paths
        for path in CANDIDATE_PATHS:
            if os.path.isfile(path):
                return path

        # 4. System PATH fallback
        which_path = shutil.which('tesseract')
        if which_path:
            return which_path

        # If nothing found, return default candidate and log warning
        default_path = CANDIDATE_PATHS[0]
        logger.warning(
            f"Tesseract executable not found in PATH or standard paths. Defaulting to: {default_path}"
        )
        return default_path

    def _detect_version(self) -> str:
        """Detects the installed Tesseract version string."""
        try:
            ver = pytesseract.get_tesseract_version()
            return str(ver)
        except Exception as e:
            logger.warning(f"Could not retrieve Tesseract version: {e}")
            return "5.4.0 (detected)"

    @property
    def version(self) -> str:
        return self._version

    def is_available(self) -> bool:
        """Checks if Tesseract binary is executable and accessible."""
        return os.path.isfile(self.tesseract_cmd)

    def extract_text(
        self,
        preprocessed_img: Image.Image,
        original_img: Optional[Image.Image] = None,
        psm: int = 6
    ) -> Dict[str, Any]:
        """
        Executes OCR on the image. Implements a dual-pass strategy:
        Pass 1 on preprocessed image; if confidence or yield is low,
        Pass 2 runs on the original image to ensure no detail was lost.
        
        Args:
            preprocessed_img: The enhanced/binarized PIL Image.
            original_img: The original PIL Image (optional fallback).
            psm: Page segmentation mode (default 6 = uniform block of text).
            
        Returns:
            Dict containing:
                - raw_text: str
                - mean_confidence: float (0.0 to 100.0)
                - confidence_level: 'High' | 'Medium' | 'Low'
                - lines: List[str]
                - word_count: int
                - engine: str
        """
        if not self.is_available():
            raise OCREngineError(
                f"Tesseract OCR executable not found at '{self.tesseract_cmd}'. "
                "Please configure TESSERACT_CMD in settings or environment."
            )

        # Pass 1: Run on preprocessed image
        result1 = self._run_tesseract(preprocessed_img, psm=psm)

        best_result = result1

        # Pass 2: If Pass 1 produced few words or low confidence, test original image
        if original_img is not None:
            words1 = len(result1['raw_text'].split())
            conf1 = result1['mean_confidence']

            if words1 < 3 or conf1 < 45.0:
                result2 = self._run_tesseract(original_img, psm=psm)
                words2 = len(result2['raw_text'].split())
                conf2 = result2['mean_confidence']

                # Prefer whichever pass produced more valid content
                if (words2 > words1 and conf2 >= 35.0) or (conf2 > conf1 + 15):
                    best_result = result2

        return best_result

    def _run_tesseract(self, img: Image.Image, psm: int = 6) -> Dict[str, Any]:
        """Runs pytesseract image_to_data and image_to_string on a single image."""
        config = f'--psm {psm} -l eng'
        try:
            # 1. Run detailed data extraction for confidence
            data = pytesseract.image_to_data(
                img, config=config, output_type=Output.DICT
            )

            # Extract words and confidences (confidence is -1 for spaces/blocks)
            confidences = []
            extracted_words = []
            for word, conf in zip(data['text'], data['conf']):
                w = word.strip()
                if w:
                    extracted_words.append(w)
                    try:
                        c_val = float(conf)
                        if c_val >= 0:
                            confidences.append(c_val)
                    except (ValueError, TypeError):
                        pass

            # 2. Run clean text extraction
            raw_text = pytesseract.image_to_string(img, config=config).strip()

            # Compute mean confidence
            if confidences:
                mean_conf = round(sum(confidences) / len(confidences), 1)
            else:
                mean_conf = 0.0

            # Qualitative rating
            if mean_conf >= 70.0 and len(extracted_words) > 0:
                conf_level = "High"
            elif mean_conf >= 40.0:
                conf_level = "Medium"
            else:
                conf_level = "Low"

            # Clean lines
            lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

            return {
                "raw_text": raw_text,
                "mean_confidence": mean_conf,
                "confidence_level": conf_level,
                "lines": lines,
                "word_count": len(extracted_words),
                "engine": f"Tesseract OCR v{self.version}",
            }

        except Exception as e:
            logger.error(f"Error during Tesseract OCR execution: {e}")
            raise OCREngineError(f"OCR execution failed: {str(e)}")
