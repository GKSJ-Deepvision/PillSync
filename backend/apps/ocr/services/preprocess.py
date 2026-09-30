"""Get a phone photo into a shape Tesseract reads well.

Pillow only, on purpose. OpenCV would allow deskewing and adaptive thresholding,
but it is a ~50 MB dependency that needs system libraries in the container. What
is done here is the part that reliably helps on a phone photograph of a printed
prescription: honour the camera's rotation, work in greyscale, make the text
large enough, and stretch the contrast. Tesseract binarises internally, so a
hard threshold here would only hurt photographs with uneven lighting.
"""

from __future__ import annotations

from PIL import Image, ImageFilter, ImageOps

# Tesseract is most accurate when capital letters are roughly 30 px tall, which
# for a typical A5 prescription means about 2,000 px across.
TARGET_WIDTH = 2000
MAX_UPSCALE = 3.0
# A 12-megapixel phone photo is far more than OCR needs, and it makes the
# engine several times slower for no gain in accuracy.
MAX_LONG_SIDE = 4200


def prepare(image: Image.Image) -> Image.Image:
    """Return a cleaned-up greyscale copy. The original is never modified."""
    # Phones store the sensor orientation in EXIF rather than rotating the pixels.
    # Skipping this is the single most common cause of "OCR returns garbage".
    image = ImageOps.exif_transpose(image)

    if image.mode in {"RGBA", "LA", "P"}:
        # Transparency would otherwise become black, and black text on a black
        # background reads as nothing.
        background = Image.new("RGB", image.size, "white")
        rgba = image.convert("RGBA")
        background.paste(rgba, mask=rgba.split()[-1])
        image = background

    image = image.convert("L")

    long_side = max(image.size)
    if long_side > MAX_LONG_SIDE:
        ratio = MAX_LONG_SIDE / long_side
        image = image.resize(
            (round(image.width * ratio), round(image.height * ratio)), Image.LANCZOS
        )
    elif image.width < TARGET_WIDTH:
        ratio = min(TARGET_WIDTH / image.width, MAX_UPSCALE)
        image = image.resize(
            (round(image.width * ratio), round(image.height * ratio)), Image.LANCZOS
        )

    image = ImageOps.autocontrast(image, cutoff=1)
    return image.filter(ImageFilter.SHARPEN)
