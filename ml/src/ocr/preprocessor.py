"""
Image Preprocessing Pipeline for PillSync Prescription OCR.
Handles file validation, resizing, grayscale conversion, contrast enhancement,
noise reduction, and adaptive thresholding to optimize OCR text recognition.
"""

import io
import os
from typing import Tuple, Dict, Any, Optional
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

# Maximum allowed upload file size (10 MB)
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

# Supported image file extensions and formats
SUPPORTED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.pdf'}
SUPPORTED_PIL_FORMATS = {'JPEG', 'PNG', 'WEBP'}


class ImageValidationError(Exception):
    """Raised when an uploaded prescription image fails validation."""
    pass


class ImagePreprocessor:
    """
    Validates and preprocesses prescription images to maximize Tesseract OCR accuracy.
    """

    def __init__(self, target_dpi: int = 300, max_dimension: int = 2500):
        self.target_dpi = target_dpi
        self.max_dimension = max_dimension

    @staticmethod
    def validate_file(file_obj, filename: str) -> Dict[str, Any]:
        """
        Validates file presence, extension, size, and image integrity.
        
        Args:
            file_obj: Django UploadedFile, file-like object, or bytes.
            filename: The original name of the uploaded file.
            
        Returns:
            Dict containing validation metadata (format, size, dimensions).
            
        Raises:
            ImageValidationError: If the file is invalid, corrupt, or unsupported.
        """
        if not file_obj:
            raise ImageValidationError("No file was uploaded.")

        # Check filename extension
        _, ext = os.path.splitext(filename.lower())
        if ext not in SUPPORTED_EXTENSIONS:
            raise ImageValidationError(
                f"Unsupported file type '{ext}'. Allowed types: JPG, JPEG, PNG, WEBP, PDF."
            )

        # Check file size
        file_obj.seek(0, os.SEEK_END)
        size_bytes = file_obj.tell()
        file_obj.seek(0)

        if size_bytes == 0:
            raise ImageValidationError("The uploaded file is empty (0 bytes).")

        if size_bytes > MAX_FILE_SIZE_BYTES:
            max_mb = MAX_FILE_SIZE_BYTES // (1024 * 1024)
            actual_mb = round(size_bytes / (1024 * 1024), 2)
            raise ImageValidationError(
                f"File size ({actual_mb} MB) exceeds maximum allowed limit of {max_mb} MB."
            )

        # Handle PDF validation (check header)
        if ext == '.pdf':
            header = file_obj.read(5)
            file_obj.seek(0)
            if not header.startswith(b'%PDF-'):
                raise ImageValidationError("Invalid or corrupted PDF file.")
            return {
                "format": "PDF",
                "size_bytes": size_bytes,
                "is_pdf": True,
            }

        # Validate image integrity using PIL
        try:
            img = Image.open(file_obj)
            img.verify()
            file_obj.seek(0)
            # Reopen to read dimensions after verify
            img = Image.open(file_obj)
            width, height = img.size
            img_format = img.format
            file_obj.seek(0)
        except Exception as e:
            raise ImageValidationError(f"Invalid or corrupted image file: {str(e)}")

        return {
            "format": img_format,
            "width": width,
            "height": height,
            "size_bytes": size_bytes,
            "is_pdf": False,
        }

    def preprocess(self, image_input) -> Tuple[Image.Image, Image.Image]:
        """
        Preprocesses a prescription image for OCR.
        
        Args:
            image_input: File path, file-like object, bytes, or PIL Image.
            
        Returns:
            Tuple of (preprocessed_image, original_image).
        """
        if isinstance(image_input, Image.Image):
            original = image_input.copy()
        elif isinstance(image_input, (bytes, bytearray)):
            original = Image.open(io.BytesIO(image_input))
        else:
            original = Image.open(image_input)

        # Convert to RGB if RGBA/P/other
        if original.mode not in ('RGB', 'L'):
            original = original.convert('RGB')

        working_img = original.copy()

        # Step 1: Auto-rotate based on EXIF tag if present
        try:
            working_img = ImageOps.exif_transpose(working_img)
        except Exception:
            pass

        # Step 2: Resize if needed
        working_img = self._optimize_resolution(working_img)

        # Step 3: Convert to Grayscale
        gray = working_img.convert('L')

        # Step 4: Contrast Enhancement
        enhancer = ImageEnhance.Contrast(gray)
        enhanced = enhancer.enhance(1.8)

        # Step 5: Mild Noise Reduction
        smoothed = enhanced.filter(ImageFilter.MedianFilter(size=3))

        # Step 6: Adaptive Thresholding / Binarization
        # Compute mean luminance and threshold around it
        histogram = smoothed.histogram()
        total_pixels = sum(histogram)
        cumulative = 0
        threshold_val = 140
        for i, count in enumerate(histogram):
            cumulative += count
            if cumulative >= total_pixels * 0.5:
                threshold_val = i
                break

        # Dynamic binarization: text becomes crisp black on white
        binarized = smoothed.point(lambda p: 255 if p > max(110, min(170, threshold_val)) else 0)

        return binarized, original

    def _optimize_resolution(self, img: Image.Image) -> Image.Image:
        """
        Scales the image if dimensions are too small for OCR or too large for memory.
        """
        width, height = img.size
        min_dim = min(width, height)
        max_dim = max(width, height)

        # Upscale if very small (< 800px)
        if min_dim < 800:
            scale = 800.0 / min_dim
            new_w = int(width * scale)
            new_h = int(height * scale)
            return img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        # Downscale if excessively large (> max_dimension)
        if max_dim > self.max_dimension:
            scale = float(self.max_dimension) / max_dim
            new_w = int(width * scale)
            new_h = int(height * scale)
            return img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        return img
