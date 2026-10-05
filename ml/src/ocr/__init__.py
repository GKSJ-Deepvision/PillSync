"""
OCR module for PillSync medication management.
Provides image preprocessing, Tesseract OCR execution, and clinical entity extraction.
"""
from .preprocessor import ImagePreprocessor
from .engine import OCREngine
from .extractor import MedicineExtractor

__all__ = ['ImagePreprocessor', 'OCREngine', 'MedicineExtractor']
