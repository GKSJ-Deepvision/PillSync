from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from .schemas import OCRResponse
from .services.extractor import ALLOWED_MIME_TYPES, MAX_IMAGE_BYTES, extract_prescription

router = APIRouter(prefix="/api/v1/ocr", tags=["ocr"])


@router.post("/extract", response_model=OCRResponse)
async def extract(file: UploadFile = File(...)) -> OCRResponse:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Upload a JPG, PNG, WEBP, TIFF, or BMP image.",
        )
    image_bytes = await file.read(MAX_IMAGE_BYTES + 1)
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="The image must be smaller than 10 MB.",
        )
    try:
        return extract_prescription(image_bytes)
    except Exception as exc:
        raise HTTPException(
            status_code=422, detail="The image could not be processed. Try a clearer photo."
        ) from exc
