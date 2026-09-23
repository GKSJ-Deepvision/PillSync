"""
Vision-model reader for HANDWRITTEN or messy prescriptions (Tesseract cannot read handwriting).
Drop into: backend/apps/ocr/services/vision.py

Configure with env vars (no extra dependencies - uses urllib):
  PILLSYNC_VISION_PROVIDER = anthropic | openai        (unset => vision disabled)
  ANTHROPIC_API_KEY / OPENAI_API_KEY
  PILLSYNC_VISION_MODEL    = optional model override

PRIVACY: this sends the prescription image to a third-party API. Get patient consent,
and use only synthetic images in tests/CI.
"""

from __future__ import annotations

import base64
import json
import os
import re
import urllib.request
from collections.abc import Callable

from .parser import Medicine, score

DEFAULT_MODELS = {"anthropic": "claude-sonnet-5", "openai": "gpt-4o"}

PROMPT = """You are reading a photographed medical prescription or medicine label. It may be handwritten.
Extract EVERY medicine listed. Return ONLY one JSON object, no prose, no markdown fences:

{"handwritten": true|false,
 "doctor": string|null, "prescription_date": string|null, "expires_on": string|null,
 "refills_remaining": integer|null,
 "medicines": [{
   "name": string,                 // generic name as written
   "brand_name": string|null,      // e.g. a name in brackets
   "strength": string|null,        // e.g. "500mg"
   "form": "tab"|"cap"|"syrup"|"inj"|"other"|null,
   "units_per_dose": number|null,  // tablets/capsules per dose
   "doses_per_day": number|null,   // "3X a day" => 3 ; null if as-needed or unclear
   "times_of_day": [ "morning"|"afternoon"|"evening"|"night" ],
   "duration_days": integer|null,  // "seven days" => 7
   "quantity": integer|null,       // total dispensed, e.g. "Cap #21" => 21
   "as_needed": boolean,
   "food_instruction": string|null,
   "instructions_text": string,    // the sig exactly as written
   "confidence": number,           // 0-1, your honest confidence in THIS medicine's fields
   "uncertain_fields": [string]    // any field you could not read clearly
 }]}

Rules: transcribe what is written; NEVER replace an unclear drug name with a similar-looking known drug -
put the field in uncertain_fields and lower confidence instead. Use null for anything not written.
Do not invent quantities or durations. Do not include the patient's name or address."""


class VisionError(Exception):
    pass


def vision_enabled() -> bool:
    p = os.environ.get("PILLSYNC_VISION_PROVIDER", "").lower()
    return (p == "anthropic" and bool(os.environ.get("ANTHROPIC_API_KEY"))) or (
        p == "openai" and bool(os.environ.get("OPENAI_API_KEY"))
    )


def _post(url: str, headers: dict, body: dict, timeout: int = 60) -> dict:
    req = urllib.request.Request(
        url, json.dumps(body).encode(), {"Content-Type": "application/json", **headers}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except Exception as e:  # network, HTTP error, bad JSON
        raise VisionError(f"vision request failed: {e}") from e


def call_vision_model(image_bytes: bytes, media_type: str = "image/jpeg") -> str:
    provider = os.environ.get("PILLSYNC_VISION_PROVIDER", "").lower()
    model = os.environ.get("PILLSYNC_VISION_MODEL") or DEFAULT_MODELS.get(provider, "")
    b64 = base64.b64encode(image_bytes).decode()
    if provider == "anthropic":
        out = _post(
            "https://api.anthropic.com/v1/messages",
            {"x-api-key": os.environ["ANTHROPIC_API_KEY"], "anthropic-version": "2023-06-01"},
            {
                "model": model,
                "max_tokens": 2000,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {"type": "base64", "media_type": media_type, "data": b64},
                            },
                            {"type": "text", "text": PROMPT},
                        ],
                    }
                ],
            },
        )
        return "".join(b.get("text", "") for b in out.get("content", []))
    if provider == "openai":
        out = _post(
            "https://api.openai.com/v1/chat/completions",
            {"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"},
            {
                "model": model,
                "max_tokens": 2000,
                "response_format": {"type": "json_object"},
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": PROMPT},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{media_type};base64,{b64}"},
                            },
                        ],
                    }
                ],
            },
        )
        return out["choices"][0]["message"]["content"]
    raise VisionError("vision provider not configured")


# ---------- validation: never trust model output blindly ----------------------------
def _f(v, lo, hi) -> float | None:
    try:
        x = float(v)
    except (TypeError, ValueError):
        return None
    return x if lo <= x <= hi else None


def normalize(raw_json: str) -> dict:
    """Model JSON string -> same dict shape as parser.parse_prescription(). Raises VisionError if unusable."""
    txt = re.sub(r"^```(?:json)?|```$", "", raw_json.strip(), flags=re.MULTILINE).strip()
    try:
        data = json.loads(txt)
    except json.JSONDecodeError as e:
        raise VisionError(f"model did not return JSON: {e}") from e
    if not isinstance(data, dict) or not isinstance(data.get("medicines"), list):
        raise VisionError("JSON missing 'medicines' list")

    meds: list[Medicine] = []
    for r in data["medicines"]:
        if not isinstance(r, dict) or not str(r.get("name") or "").strip():
            continue
        m = Medicine(
            name=str(r["name"]).strip().title(), raw_text=str(r.get("instructions_text") or "")
        )
        if r.get("brand_name"):
            m.warnings.append(f"Brand name written: {r['brand_name']}")
        m.strength = str(r.get("strength") or "").replace(" ", "").lower()
        m.form = str(r.get("form") or "")
        m.units_per_dose = _f(r.get("units_per_dose"), 0.25, 20) or 1.0
        m.doses_per_day = _f(r.get("doses_per_day"), 0.25, 12)
        m.times_of_day = [
            t
            for t in (r.get("times_of_day") or [])
            if t in ("morning", "afternoon", "evening", "night", "bedtime")
        ]
        d = _f(r.get("duration_days"), 1, 730)
        m.duration_days = int(d) if d else None
        q = _f(r.get("quantity"), 1, 5000)
        m.food_instruction = str(r.get("food_instruction") or "")
        m.as_needed = bool(r.get("as_needed"))
        if q:
            m.quantity, m.quantity_source = int(q), "printed"
        if m.doses_per_day and m.duration_days:  # arithmetic cross-check catches misread digits
            calc = round(m.units_per_dose * m.doses_per_day * m.duration_days)
            if m.quantity is None:
                m.quantity, m.quantity_source = calc, "calculated"
            elif m.quantity != calc:
                m.warnings.append(
                    f"Quantity {m.quantity} differs from schedule x duration ({calc}). Check the handwriting."
                )
        for u in r.get("uncertain_fields") or []:
            m.warnings.append(f"Model unsure about: {u}")
        score(m)
        conf = _f(r.get("confidence"), 0, 1)
        if conf is not None:
            m.confidence = round(min(m.confidence, conf), 2)
        if data.get("handwritten"):  # handwriting => a human must always confirm
            m.needs_review = True
        m.needs_review = m.needs_review or m.confidence < 0.8
        meds.append(m)

    return {
        "doctor": str(data.get("doctor") or ""),
        "prescription_date": str(data.get("prescription_date") or ""),
        "expires_on": str(data.get("expires_on") or ""),
        "refills_remaining": (
            data.get("refills_remaining")
            if isinstance(data.get("refills_remaining"), int)
            else None
        ),
        "handwritten": bool(data.get("handwritten")),
        "medicines": [m.to_dict() for m in meds],
        "medicine_count": len(meds),
        "needs_review": any(m.needs_review for m in meds) or not meds,
    }


def extract_with_vision(
    image_bytes: bytes,
    media_type: str = "image/jpeg",
    caller: Callable[[bytes, str], str] = call_vision_model,
) -> dict:
    return normalize(caller(image_bytes, media_type))
