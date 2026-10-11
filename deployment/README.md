# Deployment guide

PillSync runs as two services plus two hosted dependencies.

| Part | Where | Notes |
|---|---|---|
| Backend (Django, gunicorn) | Render web service, Docker | Builds `backend/Dockerfile`; runs `migrate` then gunicorn |
| Frontend (React, Vite) | Render | Build: `npm install && npm run build`; publish `dist` |
| Database and login | Supabase | PostgreSQL via the connection pooler |
| Vision OCR | Gemini API | Falls back to Tesseract if unavailable |

## Backend (Render web service)

1. Create a **Web Service** from the GitHub repo and branch, with root directory `backend` and runtime **Docker**.
2. The Dockerfile start command is:
   `python manage.py migrate --noinput && gunicorn --timeout 180 --workers 1 --threads 2 config.wsgi:application --bind 0.0.0.0:${PORT:-10000}`
3. Add the environment variables below in the service's **Environment** tab. Never commit real values.
4. Enable Auto-Deploy so each push redeploys.

### Backend environment variables (names only)

| Variable | Value |
|---|---|
| `DJANGO_SECRET_KEY` | a long random secret |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_ALLOWED_HOSTS` | the backend hostname |
| `SUPABASE_DB_HOST` | **hostname only**, e.g. `aws-0-<region>.pooler.supabase.com` (no port, no database name) |
| `SUPABASE_DB_PORT` | `5432` |
| `SUPABASE_DB_NAME` | `postgres` |
| `SUPABASE_DB_USER` | `postgres.<project-ref>` |
| `SUPABASE_DB_PASSWORD` | the database password |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` (verifies login tokens) |
| `PILLSYNC_VISION_PROVIDER`, `PILLSYNC_VISION_MODEL`, `GEMINI_API_KEY` | vision OCR settings |
| `TESSERACT_CMD` | leave unset, or `/usr/bin/tesseract` (never a Windows path) |

The allowed frontend origins are in `CORS_ALLOWED_ORIGINS` in `backend/config/settings/base.py`.

## Frontend (Render)

1. Create the service with root directory `frontend`.
2. Set `VITE_API_BASE_URL` to the backend origin, with no trailing slash. Vite reads it at **build time**, so rebuild after changing it.
3. Also set the Supabase variables the frontend needs (see `frontend/.env.example`).

## Checking a deployment

Run `curl.exe -i https://<backend-host>/api/ocr/admin-monitoring/` in PowerShell. A `401 Unauthorized` means the backend is up and asking for a login. In the Render logs you should see `No migrations to apply.` (or the migrations being applied) and then gunicorn starting.

## Free-plan limits

- The backend sleeps when idle; the first request can take 50 seconds or more.
- About 512 MB of memory, so use small images when testing OCR.
- Render's disk is wiped on each deploy, so data lives in Supabase.
- Supabase free projects can pause after inactivity.

## Troubleshooting seen in this project

| Symptom | Cause | Fix |
|---|---|---|
| 500 on every database request | `SUPABASE_DB_HOST` contained port and database name | Use the bare hostname |
| 500 on a new table or column | Migrations not applied | The start command runs `migrate` |
| 502 on scan, `WORKER TIMEOUT` in logs | Gunicorn's 30-second default | `--timeout 180` |
| Page calls `localhost` in production | `VITE_API_BASE_URL` missing at build time | Set it and rebuild |