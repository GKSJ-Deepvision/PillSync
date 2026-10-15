"""Image preprocessing + feature extraction shared by train.py and recognizer.py.

Keeping this in one place matters: the handwritten-word classifier is only
as good as the feature pipeline being *identical* at train and inference
time. Previously the training script and the recognizer each had their own,
slightly different, hand-rolled HOG implementation, which is an easy way to
silently degrade a model without anyone noticing.
"""

from __future__ import annotations

import random

import numpy as np
from PIL import Image, ImageOps
from skimage.feature import hog

IMAGE_SIZE = (128, 32)  # width, height


def prepare_image(image: Image.Image) -> Image.Image:
    """Grayscale, contrast-normalize, invert (ink=bright), and pad/center."""
    image = image.convert("L")
    image = ImageOps.autocontrast(image)
    image = ImageOps.invert(image)
    image.thumbnail(IMAGE_SIZE)
    canvas = Image.new("L", IMAGE_SIZE, 0)
    canvas.paste(image, ((IMAGE_SIZE[0] - image.width) // 2, (IMAGE_SIZE[1] - image.height) // 2))
    return canvas


def extract_features(image: Image.Image) -> np.ndarray:
    """HOG descriptor for a already-``prepare_image``d word image."""
    arr = np.asarray(image, dtype=np.float32) / 255.0
    return hog(
        arr,
        orientations=9,
        pixels_per_cell=(8, 8),
        cells_per_block=(2, 2),
        block_norm="L2-Hys",
        feature_vector=True,
    ).astype(np.float32)


def augment(image: Image.Image, count: int, seed: int) -> list[Image.Image]:
    """Produce ``count`` randomly perturbed copies of a prepared word image.

    Applies small rotations, shear, stroke-thickness changes (dilate/erode),
    blur, translation, and occasional pixel noise -- the standard recipe for
    making a small handwriting dataset (40 images/class here) generalize
    beyond the exact strokes it was given.
    """
    import cv2

    rng = random.Random(seed)
    arr = np.asarray(image, dtype=np.uint8)
    h, w = arr.shape
    out = []
    for _ in range(count):
        im = arr.copy()
        angle = rng.uniform(-12, 12)
        matrix = cv2.getRotationMatrix2D((w / 2, h / 2), angle, rng.uniform(0.85, 1.15))
        im = cv2.warpAffine(im, matrix, (w, h), borderValue=0)

        shear = rng.uniform(-0.2, 0.2)
        shear_matrix = np.float32([[1, shear, 0], [0, 1, 0]])
        im = cv2.warpAffine(im, shear_matrix, (w, h), borderValue=0)

        thickness = rng.choice([0, 0, 1, 1, 1, 2, 2])
        if thickness > 0:
            kernel = np.ones((thickness + 1, thickness + 1), np.uint8)
            im = cv2.dilate(im, kernel, iterations=1) if rng.random() < 0.5 else cv2.erode(
                im, kernel, iterations=1
            )

        if rng.random() < 0.5:
            im = cv2.GaussianBlur(im, (3, 3), rng.uniform(0.3, 1.0))

        dx, dy = rng.randint(-5, 5), rng.randint(-3, 3)
        shift_matrix = np.float32([[1, 0, dx], [0, 1, dy]])
        im = cv2.warpAffine(im, shift_matrix, (w, h), borderValue=0)

        if rng.random() < 0.3:
            noise = rng.uniform(0, 15)
            im = np.clip(im.astype(np.float32) + np.random.normal(0, noise, im.shape), 0, 255).astype(
                np.uint8
            )

        out.append(Image.fromarray(im))
    return out
