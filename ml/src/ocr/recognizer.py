from __future__ import annotations

import io
from pathlib import Path

import joblib
import numpy as np
from PIL import Image, ImageOps


MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "handwritten_medicine_classifier.joblib"
IMAGE_SIZE = (128, 32)
HOG_IMAGE_SIZE = (64, 32)
PRINTED_MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "printed_medicine_classifier.joblib"
PRINTED_IMAGE_SIZE = (128, 128)


class HandwrittenMedicineRecognizer:
    def __init__(self, model_path: Path = MODEL_PATH):
        self.artifact = joblib.load(model_path)

    def predict(self, image_bytes: bytes) -> tuple[str, float]:
        image = np.asarray(ImageOps.invert(ImageOps.autocontrast(Image.open(io.BytesIO(image_bytes)).convert("L")).resize(HOG_IMAGE_SIZE)), dtype=np.float32) / 255
        vertical, horizontal = np.gradient(image)
        magnitude = np.sqrt(horizontal * horizontal + vertical * vertical)
        angle = (np.arctan2(vertical, horizontal) * 180 / np.pi) % 180
        features = []
        for top in range(0, HOG_IMAGE_SIZE[1], 8):
            for left in range(0, HOG_IMAGE_SIZE[0], 8):
                cell_magnitude = magnitude[top : top + 8, left : left + 8].ravel()
                cell_angle = angle[top : top + 8, left : left + 8].ravel()
                histogram = np.zeros(9)
                np.add.at(histogram, (np.floor(cell_angle / 20).astype(int) % 9), cell_magnitude)
                features.extend(histogram / (np.linalg.norm(histogram) + 1e-6))
        features = np.asarray(features, dtype=np.float32).reshape(1, -1)
        probabilities = self.artifact["classifier"].predict_proba(features)[0]
        index = int(np.argmax(probabilities))
        return str(self.artifact["classifier"].classes_[index]), float(probabilities[index])


class PrintedMedicineRecognizer:
    def __init__(self, model_path: Path = PRINTED_MODEL_PATH):
        self.artifact = joblib.load(model_path)

    def predict(self, image_bytes: bytes) -> list[str]:
        image = Image.open(io.BytesIO(image_bytes)).convert("L")
        image = ImageOps.invert(ImageOps.autocontrast(image))
        image.thumbnail(PRINTED_IMAGE_SIZE)
        canvas = Image.new("L", PRINTED_IMAGE_SIZE, 0)
        canvas.paste(image, ((PRINTED_IMAGE_SIZE[0] - image.width) // 2, (PRINTED_IMAGE_SIZE[1] - image.height) // 2))
        features = np.asarray(canvas, dtype=np.float32).reshape(1, -1) / 255.0
        probabilities = self.artifact["classifier"].predict_proba(features)[0]
        return [str(name) for name, probability in zip(self.artifact["encoder"].classes_, probabilities) if probability >= 0.35]