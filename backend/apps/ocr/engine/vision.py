"""
Vision-model reader for HANDWRITTEN or messy prescriptions.

Supported providers:
  anthropic
  openai
  gemini

No extra Python dependencies required.
Uses urllib for API requests.

Environment variables:
  PILLSYNC_VISION_PROVIDER = anthropic | openai | gemini
  ANTHROPIC_API_KEY
  OPENAI_API_KEY
  GEMINI_API_KEY
  PILLSYNC_VISION_MODEL = optional model override

Privacy:
  This sends prescription/medicine images to the selected third-party API.
  Use patient consent and synthetic images for tests/CI.
"""

from __future__ import annotations

import base64
import json
import os
import re
import urllib.request
from collections.abc import Callable

from .parser import Medicine, score

DEFAULT_MODELS = {
    "anthropic": "claude-sonnet-5",
    "openai": "gpt-4o",
    "gemini": "gemini-2.5-flash",
}


PROMPT = """You are reading a photographed medical prescription or medicine label.
It may be handwritten.

Extract EVERY medicine listed.

Return ONLY one JSON object. No prose. No markdown fences.

{
  "handwritten": true|false,
  "doctor": string|null,
  "prescription_date": string|null,
  "expires_on": string|null,
  "refills_remaining": integer|null,
  "medicines": [
    {
      "name": string,
      "brand_name": string|null,
      "strength": string|null,
      "form": "tab"|"cap"|"syrup"|"inj"|"other"|null,
      "units_per_dose": number|null,
      "doses_per_day": number|null,
      "times_of_day": [
        "morning"|"afternoon"|"evening"|"night"
      ],
      "duration_days": integer|null,
      "quantity": integer|null,
      "as_needed": boolean,
      "food_instruction": string|null,
      "instructions_text": string,
      "confidence": number,
      "uncertain_fields": [string]
    }
  ]
}

Rules:

1. Transcribe what is actually written.
2. NEVER replace an unclear drug name with a similar-looking known drug.
3. If a drug name is unclear, put "name" in uncertain_fields and lower confidence.
4. Use null for information that is not written.
5. Do not invent quantities.
6. Do not invent durations.
7. Do not infer a medication that is not visible.
8. Do not include the patient's name or address.
9. If handwriting is present, set handwritten=true.
10. confidence must represent your honest confidence in the extracted medicine fields.
11. instructions_text must contain the prescription instruction exactly as readable.
"""


class VisionError(Exception):
    pass


def vision_enabled() -> bool:
    provider = os.environ.get("PILLSYNC_VISION_PROVIDER", "").lower()

    return (
        (provider == "anthropic" and bool(os.environ.get("ANTHROPIC_API_KEY")))
        or (provider == "openai" and bool(os.environ.get("OPENAI_API_KEY")))
        or (provider == "gemini" and bool(os.environ.get("GEMINI_API_KEY")))
    )


def _post(
    url: str,
    headers: dict,
    body: dict,
    timeout: int = 60,
) -> dict:
    request = urllib.request.Request(
        url,
        json.dumps(body).encode("utf-8"),
        {
            "Content-Type": "application/json",
            **headers,
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read())

    except Exception as exc:
        raise VisionError(f"vision request failed: {exc}") from exc


# ---------------------------------------------------------------------------
# Gemini
# ---------------------------------------------------------------------------


def _call_gemini(
    image_bytes: bytes,
    media_type: str,
    model: str,
) -> str:
    """
    Send the image to Gemini using the REST generateContent API.

    Gemini accepts inline base64 image data and can return structured JSON.
    """

    api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        raise VisionError("GEMINI_API_KEY is not configured")

    b64 = base64.b64encode(image_bytes).decode("ascii")

    url = "https://generativelanguage.googleapis.com/" f"v1beta/models/{model}:generateContent"

    body = {
        "contents": [
            {
                "parts": [
                    {
                        "inline_data": {
                            "mime_type": media_type,
                            "data": b64,
                        }
                    },
                    {
                        "text": PROMPT,
                    },
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
        },
    }

    response = _post(
        url,
        {
            "x-goog-api-key": api_key,
        },
        body,
    )

    try:
        candidates = response.get("candidates") or []

        if not candidates:
            raise VisionError(f"Gemini returned no candidates: {response}")

        parts = candidates[0].get("content", {}).get("parts", [])

        text_parts = [part.get("text", "") for part in parts if part.get("text")]

        result = "".join(text_parts).strip()

        if not result:
            raise VisionError("Gemini returned an empty response")

        return result

    except VisionError:
        raise

    except Exception as exc:
        raise VisionError(f"unexpected Gemini response: {exc}") from exc


# ---------------------------------------------------------------------------
# Main provider dispatcher
# ---------------------------------------------------------------------------


def call_vision_model(
    image_bytes: bytes,
    media_type: str = "image/jpeg",
) -> str:

    provider = os.environ.get(
        "PILLSYNC_VISION_PROVIDER",
        "",
    ).lower()

    model = os.environ.get("PILLSYNC_VISION_MODEL") or DEFAULT_MODELS.get(provider, "")

    if provider == "gemini":
        return _call_gemini(
            image_bytes,
            media_type,
            model,
        )

    b64 = base64.b64encode(image_bytes).decode("ascii")

    # -----------------------------------------------------------------------
    # Anthropic
    # -----------------------------------------------------------------------

    if provider == "anthropic":

        out = _post(
            "https://api.anthropic.com/v1/messages",
            {
                "x-api-key": os.environ["ANTHROPIC_API_KEY"],
                "anthropic-version": "2023-06-01",
            },
            {
                "model": model,
                "max_tokens": 2000,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": b64,
                                },
                            },
                            {
                                "type": "text",
                                "text": PROMPT,
                            },
                        ],
                    }
                ],
            },
        )

        return "".join(block.get("text", "") for block in out.get("content", []))

    # -----------------------------------------------------------------------
    # OpenAI
    # -----------------------------------------------------------------------

    if provider == "openai":

        out = _post(
            "https://api.openai.com/v1/chat/completions",
            {
                "Authorization": (f"Bearer {os.environ['OPENAI_API_KEY']}"),
            },
            {
                "model": model,
                "max_tokens": 2000,
                "response_format": {
                    "type": "json_object",
                },
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": PROMPT,
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": (f"data:{media_type};base64,{b64}")},
                            },
                        ],
                    }
                ],
            },
        )

        return out["choices"][0]["message"]["content"]

    raise VisionError("vision provider not configured")


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


def _f(v, lo, hi) -> float | None:
    try:
        value = float(v)
    except (TypeError, ValueError):
        return None

    return value if lo <= value <= hi else None


def normalize(raw_json: str) -> dict:
    """
    Model JSON string -> same dict shape as parser.parse_prescription().

    The model output is validated before it can reach the rest of PillSync.
    """

    txt = re.sub(
        r"^```(?:json)?|```$",
        "",
        raw_json.strip(),
        flags=re.MULTILINE,
    ).strip()

    try:
        data = json.loads(txt)

    except json.JSONDecodeError as exc:
        raise VisionError(f"model did not return JSON: {exc}") from exc

    if not isinstance(data, dict) or not isinstance(data.get("medicines"), list):
        raise VisionError("JSON missing 'medicines' list")

    medicines: list[Medicine] = []

    for row in data["medicines"]:

        if not isinstance(row, dict) or not str(row.get("name") or "").strip():
            continue

        medicine = Medicine(
            name=str(row["name"]).strip().title(),
            raw_text=str(row.get("instructions_text") or ""),
        )

        if row.get("brand_name"):
            medicine.warnings.append(f"Brand name written: {row['brand_name']}")

        medicine.strength = str(row.get("strength") or "").replace(" ", "").lower()

        medicine.form = str(row.get("form") or "")

        medicine.units_per_dose = (
            _f(
                row.get("units_per_dose"),
                0.25,
                20,
            )
            or 1.0
        )

        medicine.doses_per_day = _f(
            row.get("doses_per_day"),
            0.25,
            12,
        )

        medicine.times_of_day = [
            time
            for time in (row.get("times_of_day") or [])
            if time
            in (
                "morning",
                "afternoon",
                "evening",
                "night",
                "bedtime",
            )
        ]

        duration = _f(
            row.get("duration_days"),
            1,
            730,
        )

        medicine.duration_days = int(duration) if duration else None

        quantity = _f(
            row.get("quantity"),
            1,
            5000,
        )

        medicine.food_instruction = str(row.get("food_instruction") or "")

        medicine.as_needed = bool(row.get("as_needed"))

        if quantity:
            medicine.quantity = int(quantity)
            medicine.quantity_source = "printed"

        # ---------------------------------------------------------------
        # Arithmetic cross-check
        # ---------------------------------------------------------------

        if medicine.doses_per_day and medicine.duration_days:

            calculated_quantity = round(
                medicine.units_per_dose * medicine.doses_per_day * medicine.duration_days
            )

            if medicine.quantity is None:

                medicine.quantity = calculated_quantity
                medicine.quantity_source = "calculated"

            elif medicine.quantity != calculated_quantity:

                medicine.warnings.append(
                    f"Quantity {medicine.quantity} differs "
                    f"from schedule x duration "
                    f"({calculated_quantity}). "
                    "Check the handwriting."
                )

        # ---------------------------------------------------------------
        # Model uncertainty
        # ---------------------------------------------------------------

        for field in row.get("uncertain_fields") or []:
            medicine.warnings.append(f"Model unsure about: {field}")

        score(medicine)

        model_confidence = _f(
            row.get("confidence"),
            0,
            1,
        )

        if model_confidence is not None:
            medicine.confidence = round(
                min(
                    medicine.confidence,
                    model_confidence,
                ),
                2,
            )

        # Handwritten prescriptions always require confirmation.
        if data.get("handwritten"):
            medicine.needs_review = True

        medicine.needs_review = medicine.needs_review or medicine.confidence < 0.8

        medicines.append(medicine)

    return {
        "doctor": str(data.get("doctor") or ""),
        "prescription_date": str(data.get("prescription_date") or ""),
        "expires_on": str(data.get("expires_on") or ""),
        "refills_remaining": (
            data.get("refills_remaining")
            if isinstance(
                data.get("refills_remaining"),
                int,
            )
            else None
        ),
        "handwritten": bool(data.get("handwritten")),
        "medicines": [medicine.to_dict() for medicine in medicines],
        "medicine_count": len(medicines),
        "needs_review": (any(medicine.needs_review for medicine in medicines) or not medicines),
    }


def extract_with_vision(
    image_bytes: bytes,
    media_type: str = "image/jpeg",
    caller: Callable[
        [bytes, str],
        str,
    ] = call_vision_model,
) -> dict:

    return normalize(
        caller(
            image_bytes,
            media_type,
        )
    )
