from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.schemas.ocr import OCRResponse
from app.services.medicine_extraction import extract_medicine_information
from app.services.ocr_service import extract_text_from_image


router = APIRouter(
    prefix="/ocr",
    tags=["OCR Recognition"],
)


ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/tiff",
}


@router.post(
    "/medicine",
    response_model=OCRResponse,
    status_code=status.HTTP_200_OK,
)
async def recognize_medicine_image(
    file: UploadFile = File(...),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Unsupported file type. Please upload a JPEG, PNG, "
                "WEBP, BMP, or TIFF image."
            ),
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded image is empty.",
        )

    try:
        extracted_text = extract_text_from_image(image_bytes)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    medicine_information = extract_medicine_information(
        extracted_text
    )

    return OCRResponse(
        filename=file.filename or "uploaded_image",
        extracted_text=extracted_text,
        **medicine_information,
    )