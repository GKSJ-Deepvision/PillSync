#!/usr/bin/env bash
# Packages the OCR datasets + trained model into one zip for distribution
# outside git (see .gitignore: ml/data/raw/* is intentionally not committed).
#
# Usage (from repo root):
#   ./scripts/package_ocr_bundle.sh
#
# Produces: dist/pillsync-ocr-data-and-model.zip containing:
#   ml/data/raw/ocr_handwritten/      (handwritten word images + labels)
#   ml/data/raw/ocr_printed/          (printed prescription images + labels)
#   ml/data/raw/medicine_reference/   (reference medicine name list)
#   ml/models/handwritten_medicine_classifier.joblib
#   ml/models/handwritten_medicine_classifier.metrics.json
#
# To restore after cloning the repo fresh:
#   unzip pillsync-ocr-data-and-model.zip -d /path/to/PillSync
set -euo pipefail
cd "$(dirname "$0")/.."

OUT_DIR="dist"
OUT_ZIP="$OUT_DIR/pillsync-ocr-data-and-model.zip"
mkdir -p "$OUT_DIR"
rm -f "$OUT_ZIP"

zip -r "$OUT_ZIP" \
  ml/data/raw/ocr_handwritten \
  ml/data/raw/ocr_printed \
  ml/data/raw/medicine_reference \
  ml/models/handwritten_medicine_classifier.joblib \
  ml/models/handwritten_medicine_classifier.metrics.json \
  -x "*.pyc" -x "__pycache__/*"

echo "Wrote $OUT_ZIP"
du -h "$OUT_ZIP"
