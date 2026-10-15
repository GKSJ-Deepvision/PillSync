# PillSync architecture overview

## Runtime components

- **Frontend:** React single-page application built with Vite. In the Render
  Blueprint it is deployed as a static site with SPA route rewrites.
- **Application data and sign-in:** The browser uses Supabase Auth and the
  Supabase database directly. Database access must be constrained by the
  project's row-level security policies; see [`../database/README.md`](../database/README.md).
- **API:** A FastAPI service under `backend/` exposes prescription OCR and
  refill-prediction endpoints. It is a separate Render Docker web service.
- **ML and OCR resources:** The API image includes the repository's `ml/`
  package and trained model artifacts. Tesseract is installed in the backend
  image for OCR.

## Main request flows

1. A patient signs in through Supabase Auth. Medication, schedule, and dose
   history operations use Supabase from the frontend.
2. The adherence dashboard aggregates dose history in the browser and renders
   the percentage, trend, streak, and per-medicine summaries.
3. Refill views send medication, schedule, and recent dose history to the
   FastAPI batch prediction endpoint. The UI has a local rule-based fallback
   if the API is unavailable.
4. Prescription images are submitted to the FastAPI OCR endpoint for
   extraction; users must review extracted details before saving them.

## Deployment topology

`render.yaml` defines `pillsync-web` (static frontend) and `pillsync-api`
(Docker backend). The API health check is `/api/health`. The frontend is
configured with `VITE_API_BASE_URL`; the backend allows the configured web
origin through `CORS_ALLOWED_ORIGINS`. Deployment instructions and the
synthetic-data-only limitation are in
[`../demo/render-deployment.md`](../demo/render-deployment.md).

## Current boundary

Several backend app directories are scaffolding rather than implemented API
services. Authentication and most medication workflows currently rely on the
frontend/Supabase integration. The OCR and refill FastAPI routes do not yet
require user authentication, so the deployed demo must not process identifiable
or real patient data.
