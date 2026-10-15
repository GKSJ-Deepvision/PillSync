# PillSync Render deployment runbook

## Deployment state

The repository contains a Render Blueprint at [`render.yaml`](../../render.yaml).
It defines a Docker web service for the FastAPI backend and a static site for
the React frontend. This runbook describes how to deploy it; it does not claim
that a Render service has been created. Record the actual URLs and deployment
date here after completing the steps below.

- **Frontend URL:** Not deployed
- **Backend URL:** Not deployed
- **Deployment date:** Not deployed
- **Render Blueprint:** `render.yaml`

## Deploy

1. Push this branch to the Git provider connected to Render.
2. In the Render Dashboard, choose **New > Blueprint**, connect the repository,
   select this branch, and confirm `render.yaml`.
3. Supply the Blueprint's prompted environment variables:
   - `CORS_ALLOWED_ORIGINS`: the exact frontend origin, for example
     `https://pillsync-web.onrender.com` (no trailing slash).
   - `VITE_API_BASE_URL`: the backend URL plus `/api`, for example
     `https://pillsync-api.onrender.com/api`.
   - `VITE_SUPABASE_URL`: the Supabase project URL.
   - `VITE_SUPABASE_ANON_KEY`: the Supabase public anon key. Never use a
     Supabase service-role key in a frontend variable.
4. Click **Deploy Blueprint**. Wait for the backend health check and frontend
   build to pass. Update the frontend variables if Render assigns different
   service URLs, then redeploy the frontend.
5. In Supabase, add the actual frontend origin to the project's authentication
   redirect URL allowlist. Verify that the database schema and row-level
   security policies required by the frontend are applied.
6. Verify `https://<backend-host>/api/health` returns
   `{"status":"ok","service":"pillsync-backend"}` and
   `https://<backend-host>/docs` loads. Then sign in with a synthetic test
   account and smoke-test medication creation, dose logging, adherence
   analytics, and refill predictions.
7. Replace the "Not deployed" fields above and in
   [`milestone-4.md`](../milestones/milestone-4.md) with the real Render URLs,
   date, and verification evidence.

## Current limitations

- The FastAPI backend currently serves OCR and refill-prediction endpoints;
  other backend modules remain scaffolding. The authentication and medication
  workflows are currently provided by the frontend's Supabase integration.
- The backend OCR and refill API routes do not currently require a user token.
  Use synthetic demo data only; do not send identifiable or real patient
  information to this deployment.
- Notification delivery, production end-to-end testing, and performance
  measurements must be verified separately. Do not report them as complete
  based solely on a successful build or health check.
- The backend Docker build requires the repository root as its build context
  because it copies both `backend/` and `ml/`. The Blueprint and CD workflow
  use that context.
