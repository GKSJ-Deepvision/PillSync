# PillSync API reference

The FastAPI service is defined in `backend/config/main.py`. When deployed, use
the backend origin as the host. Interactive OpenAPI documentation is available
at `/docs`; the readiness endpoint is `/api/health`.

The frontend's `VITE_API_BASE_URL` includes the `/api` prefix, for example
`https://pillsync-api.onrender.com/api`.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Backend liveness. |
| `GET` | `/api/v1/refills/health` | Refill model version and load/training metadata. |
| `POST` | `/api/v1/refills/predict` | Predict stock outlook for one medication. |
| `POST` | `/api/v1/refills/predict/batch` | Predict and urgency-sort one patient's medications. |
| `POST` | `/api/v1/refills/predict/caregiver` | Summarize and rank multiple patients by refill urgency. |
| `POST` | `/api/v1/ocr/extract` | Extract possible medication details from an uploaded image. |

### Refill prediction

Prediction endpoints accept JSON. A single-medication request has this shape:

```json
{
  "medication": {
    "id": "demo-medication",
    "name": "Example medicine",
    "stock_quantity": 60,
    "refill_lead_days": 5
  },
  "schedules": [
    {
      "dose_quantity": 2,
      "days_of_week": [0, 1, 2, 3, 4, 5, 6],
      "is_active": true
    }
  ],
  "dose_logs": [],
  "as_of": "2026-01-01"
}
```

The response includes stock remaining, depletion/refill dates, stock status,
adherence risk, model version, and prediction confidence. Batch requests use a
`cases` array of medication/schedule/log objects. Caregiver requests use a
`patients` array, each with `patient_id`, optional `patient_name`, and `cases`.
Pydantic schemas in `backend/apps/refills/schemas.py` define the complete
request and response fields.

### OCR

Send a multipart form request with an `image/*` file field named `file`.
Supported types are JPEG, PNG, WEBP, TIFF, and BMP; uploads are limited to
10 MiB. The response contains extracted text, medicine candidates, a
confidence score, and the engine identifier. A `415` indicates an unsupported
content type, `413` an oversized image, and `422` an image that could not be
processed.

## Access and data handling

The current OCR and refill endpoints do not enforce user authentication. Treat
them as demo endpoints: use synthetic data only and do not send personally
identifiable or real health information. Do not put service-role credentials
in frontend variables. The frontend's direct Supabase access depends on the
database's row-level security policies.
