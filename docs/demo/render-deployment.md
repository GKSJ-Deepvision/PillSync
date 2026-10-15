# PillSync Render deployment runbook

## Deployment state

The repository contains a Render Blueprint at [`render.yaml`](../../render.yaml).
The services below were deployed on Render's Free plan.

- **Frontend URL:** https://pillsync-web-optm.onrender.com
- **Backend URL:** https://pillsync-api-free.onrender.com
- **Deployment date:** 2026-10-15
- **Render Blueprint:** `render.yaml`

## Deploy

1. Push this branch to the Git provider connected to Render.
2. Create the backend as a Docker web service from this branch. Leave **Root
   Directory** blank, set **Dockerfile Path** to `backend/Dockerfile`, and
   select the **Free** instance.
3. Create the frontend as a static site from this branch. Set **Root
   Directory** to `frontend`, **Build Command** to `npm ci && npm run build`,
   **Publish Directory** to `dist`, and select the free static site.
4. Set the frontend build variables:
   - `VITE_API_BASE_URL=https://pillsync-api-free.onrender.com/api`
   - `VITE_SUPABASE_URL` to the Supabase project URL.
   - `VITE_SUPABASE_ANON_KEY` to the Supabase public anon key. Never use a
     Supabase service-role key in a frontend variable.
5. In Supabase, add `https://pillsync-web-optm.onrender.com` to the project's
   authentication redirect URL allowlist. Verify that the database schema and
   row-level security policies required by the frontend are applied.
6. Verify `https://pillsync-api-free.onrender.com/api/health` returns
   `{"status":"ok","service":"pillsync-backend"}` and
   `https://pillsync-api-free.onrender.com/docs` loads. The backend health
   endpoint and a browser-origin refill API/CORS request have been verified.
   Full sign-in and medication workflow tests remain to be run.
7. If the frontend domain changes, update the allowed origin in
   `backend/config/main.py` and redeploy the backend.

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
