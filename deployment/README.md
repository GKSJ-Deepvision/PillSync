# Deployment

| Path | Purpose |
|---|---|
| `docker/` | Extra Dockerfiles and entrypoint scripts beyond the app-level ones |
| `nginx/` | Reverse proxy and static file serving config |
| `cloud/aws/` | AWS deployment notes, task definitions, IaC |
| `cloud/azure/` | Azure deployment notes, App Service / Container Apps config |
| `scripts/` | Build, migrate, seed and release helper scripts |

The repository contains local Docker Compose configuration, but no live deployment
has been performed for this milestone. A deployment review must not treat a
successful image build or frontend build as a deployment.

## Render + Neon deployment

The supported topology is a Render native Python web service for Django, a Render
static site for the Vite frontend, and Neon PostgreSQL. The repository includes a
`render.yaml` Blueprint, but it intentionally does not provision Redis, notification
providers, or a database. Render service names and generated URLs are not known until
the services are created, so the `sync: false` values must be filled in the Render
dashboard.

### 1. Create Neon

Create a Neon project and database, then copy its pooled or direct PostgreSQL
connection string from the Neon dashboard. Store it as `DATABASE_URL` in Render; do
not commit it or paste it into this repository. The production parser requires SSL
and adds `sslmode=require` when necessary.

### 2. Create the Render services

Create the services from `render.yaml`, or create them manually with these settings:

| Service | Root directory | Build command | Start/publish |
|---|---|---|---|
| Django web service | `backend` | `pip install -r requirements/prod.txt && python manage.py collectstatic --noinput` | `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT` |
| Vite static site | `frontend` | `npm ci && npm run build` | Publish `dist` |

Configure the API health check as `/health/ready/`. Configure the static site rewrite
`/*` to `/index.html` so browser refreshes on client-side routes work.

Required API environment variables:

```text
DJANGO_SETTINGS_MODULE=config.settings.prod
SECRET_KEY=<long-random-value>
DATABASE_URL=postgresql://<user>:<password>@<neon-host>/<database>?sslmode=require
ALLOWED_HOSTS=<api-host>,<optional-custom-api-host>
CSRF_TRUSTED_ORIGINS=https://<frontend-host>
CORS_ALLOWED_ORIGINS=https://<frontend-host>
DATABASE_CONN_MAX_AGE=60
```

Set the frontend build variable to the actual API origin and `/api` suffix:

```text
VITE_API_BASE_URL=https://<api-host>/api
```

Do not use `*` for production origins. If a custom domain is added, update all
three host/origin variables consistently.

### 3. Run migrations and verify

Before the first release, open the API service shell (or use an equivalent controlled
one-off command) and run:

```text
python manage.py migrate --noinput
python manage.py createsuperuser
```

Run migrations before deploying code that depends on new schema, take a database
backup where supported, and stop the release if migration fails. The Blueprint uses
Gunicorn as the web process; it does not run migrations on every boot.

Verify both public checks:

```text
GET https://<api-host>/health/ready/
GET https://<api-host>/api/health/
```

Then test registration and login from the deployed frontend, followed by an
authenticated dashboard request. Do not record a production URL here until those
steps have actually been completed.

### 4. Background jobs and notifications

Local Docker Compose includes Redis, Celery worker, and Celery Beat. The Render
Blueprint does not create them. Reminder generation, prescription-expiry reminders,
and notification dispatch require a reachable Redis broker, a worker, Beat, and any
provider credentials used by the notification implementation. Configure
`CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND` only after selecting a supported Redis
provider, and run:

```text
celery -A config worker -l info
celery -A config beat -l info
```

Without those services, the web API and synchronous features can run, but scheduled
reminders and notification delivery are not operational. Do not replace them with
an unauthenticated cron endpoint; no such endpoint is implemented in this
repository. If an external scheduler is later added, it must invoke a narrowly
scoped, authenticated and idempotent job mechanism.

### 5. Uploads, logs, and limits

Prescription and OCR files are written below `MEDIA_ROOT` on the local filesystem.
Render web-service storage is ephemeral and is not durable user-file storage. Use a
separately approved object-storage integration before relying on uploads in
production; no provider or credentials are added here. Never put prescription
contents or provider secrets in logs.

Use Render logs to diagnose startup, migration, database SSL, CORS, and static-file
errors. Common checks are:

- `DATABASE_URL` is present and points to the intended Neon database.
- `ALLOWED_HOSTS` contains the API hostname.
- `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` contain the HTTPS frontend
  origin exactly.
- `VITE_API_BASE_URL` ends with `/api` and does not point to localhost.
- `collectstatic` completed during the API build.

Free plans and trial tiers can sleep or impose resource, build, bandwidth, and
storage limits. Confirm current limits in the Render and Neon dashboards rather than
treating any provider limit as permanent.

## Local and release checks

For local development, keep using `backend/.env`, Docker Compose, and the Vite
proxy. Before a release, run the project checks from the repository root:

```text
backend\.venv\Scripts\python.exe manage.py check
backend\.venv\Scripts\python.exe manage.py check --deploy
backend\.venv\Scripts\python.exe manage.py test
cd frontend
npm ci
npm test -- --run --maxWorkers=1
npm run lint
npm run build
```

No deployment, external service creation, production migration, or live verification
is claimed by this repository change.

Deployment credentials belong in GitHub Secrets or your cloud provider's secret
store. Never in this folder.
