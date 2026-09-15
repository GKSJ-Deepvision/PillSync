"""Train the handwritten medicine-name recognizer.

Run from the repository root:
    python -m ml.src.ocr.train
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

import joblib
import numpy as np
from PIL import Image, ImageOps
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import accuracy_score
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.svm import SVC


ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw" / "ocr_handwritten"
MODEL_PATH = ROOT / "models" / "handwritten_medicine_classifier.joblib"
PRINTED_MODEL_PATH = ROOT / "models" / "printed_medicine_classifier.joblib"
IMAGE_SIZE = (128, 32)
HOG_IMAGE_SIZE = (64, 32)
PRINTED_IMAGE_SIZE = (128, 128)


def _features(path: Path) -> np.ndarray:
    image = Image.open(path).convert("L")
    image = ImageOps.invert(ImageOps.autocontrast(image))
    image.thumbnail(IMAGE_SIZE)
    canvas = Image.new("L", IMAGE_SIZE, 0)
    canvas.paste(image, ((IMAGE_SIZE[0] - image.width) // 2, (IMAGE_SIZE[1] - image.height) // 2))
    return np.asarray(canvas, dtype=np.float32).reshape(-1) / 255.0


def _hog_features(path: Path) -> np.ndarray:
    image = np.asarray(ImageOps.invert(ImageOps.autocontrast(Image.open(path).convert("L")).resize(HOG_IMAGE_SIZE)), dtype=np.float32) / 255
    vertical, horizontal = np.gradient(image)
    magnitude = np.sqrt(horizontal * horizontal + vertical * vertical)
    angle = (np.arctan2(vertical, horizontal) * 180 / np.pi) % 180
    features = []
    bin_count = 9
    for top in range(0, HOG_IMAGE_SIZE[1], 8):
        for left in range(0, HOG_IMAGE_SIZE[0], 8):
            cell_magnitude = magnitude[top : top + 8, left : left + 8].ravel()
            cell_angle = angle[top : top + 8, left : left + 8].ravel()
            histogram = np.zeros(bin_count)
            np.add.at(histogram, (np.floor(cell_angle / (180 / bin_count)).astype(int) % bin_count), cell_magnitude)
            features.extend(histogram / (np.linalg.norm(histogram) + 1e-6))
    return np.asarray(features, dtype=np.float32)


def _load_split(name: str) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    split = RAW / name
    label_file = split / f"{name.lower()}_labels.csv"
    image_dir = split / f"{name.lower()}_words"
    features, labels, generics = [], [], []
    with label_file.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            image_path = image_dir / row["IMAGE"]
            if image_path.exists():
                features.append(_features(image_path))
                labels.append(row["MEDICINE_NAME"])
                generics.append(row["GENERIC_NAME"])
    return np.asarray(features), np.asarray(labels), np.asarray(generics)


def _printed_features(path: Path) -> np.ndarray:
    image = Image.open(path).convert("L")
    image = ImageOps.invert(ImageOps.autocontrast(image))
    image.thumbnail(PRINTED_IMAGE_SIZE)
    canvas = Image.new("L", PRINTED_IMAGE_SIZE, 0)
    canvas.paste(image, ((PRINTED_IMAGE_SIZE[0] - image.width) // 2, (PRINTED_IMAGE_SIZE[1] - image.height) // 2))
    return np.asarray(canvas, dtype=np.float32).reshape(-1) / 255.0


def _load_printed() -> tuple[np.ndarray, list[list[str]]]:
    image_dir = RAW / ".." / "ocr_printed" / "images"
    labels_path = image_dir.parent / "labels.csv"
    labels_by_image: dict[str, list[str]] = {}
    with labels_path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            labels_by_image.setdefault(row["image"], []).append(row["medicine"])
    features, labels = [], []
    for filename, medicines in labels_by_image.items():
        image_path = image_dir / filename
        if image_path.exists():
            features.append(_printed_features(image_path))
            labels.append(medicines)
    return np.asarray(features), labels


def train_printed() -> dict:
    features, labels = _load_printed()
    if len(features) == 0:
        raise RuntimeError("No printed prescription images or labels found")
    encoder = MultiLabelBinarizer()
    targets = encoder.fit_transform(labels)
    classifier = OneVsRestClassifier(SGDClassifier(loss="log_loss", max_iter=1000, tol=1e-3, random_state=42))
    classifier.fit(features, targets)
    joblib.dump({"classifier": classifier, "encoder": encoder, "image_size": PRINTED_IMAGE_SIZE}, PRINTED_MODEL_PATH)
    predictions = classifier.predict(features)
    metrics = {"printed_samples": len(features), "printed_classes": len(encoder.classes_), "printed_training_subset_accuracy": float(np.mean(np.all(predictions == targets, axis=1))), "model": str(PRINTED_MODEL_PATH)}
    print(metrics)
    return metrics


def train() -> dict:
    _, train_y, train_generic = _load_split("Training")
    _, validation_y, _ = _load_split("Validation")
    _, test_y, _ = _load_split("Testing")
    train_x = np.asarray([_hog_features(path) for path in _image_paths("Training")])
    validation_x = np.asarray([_hog_features(path) for path in _image_paths("Validation")])
    test_x = np.asarray([_hog_features(path) for path in _image_paths("Testing")])
    if len(train_x) == 0:
        raise RuntimeError(f"No labeled images found under {RAW}")

    classifier = SVC(C=10, kernel="rbf", probability=True, class_weight="balanced", random_state=42)
    classifier.fit(train_x, train_y)
    artifact = {
        "classifier": classifier,
        "generic_by_medicine": {medicine: generic for medicine, generic in zip(train_y, train_generic)},
        "image_size": IMAGE_SIZE,
        "feature_type": "hog",
    }
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, MODEL_PATH)
    metrics = {
        "train_accuracy": accuracy_score(train_y, classifier.predict(train_x)),
        "validation_accuracy": accuracy_score(validation_y, classifier.predict(validation_x)) if len(validation_x) else None,
        "test_accuracy": accuracy_score(test_y, classifier.predict(test_x)) if len(test_x) else None,
        "samples": len(train_x),
        "classes": len(classifier.classes_),
        "model": str(MODEL_PATH),
    }
    print(metrics)
    return metrics


def _image_paths(name: str) -> list[Path]:
    split = RAW / name
    label_file = split / f"{name.lower()}_labels.csv"
    image_dir = split / f"{name.lower()}_words"
    with label_file.open(newline="", encoding="utf-8") as handle:
        return [image_dir / row["IMAGE"] for row in csv.DictReader(handle) if (image_dir / row["IMAGE"]).exists()]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train the handwritten medicine OCR classifier")
    parser.parse_args()
    train()
    train_printed()