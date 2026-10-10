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

## Production prerequisites

- Set `DJANGO_SETTINGS_MODULE=config.settings.prod`.
- Provide a long, randomly generated `SECRET_KEY`; never reuse the example value.
- Provide `ALLOWED_HOSTS` with the public backend host and
  `CSRF_TRUSTED_ORIGINS` with the HTTPS frontend origin.
- Provide `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, and
  optionally `POSTGRES_PORT` and `DATABASE_CONN_MAX_AGE`.
- Provide `CORS_ALLOWED_ORIGINS` with the exact frontend origin. Do not use `*`.
- Configure Redis through `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND`, and run
  both the Celery worker and beat processes for reminder and notification tasks.
- Configure notification provider credentials and `FIREBASE_CREDENTIALS_PATH` only
  through the platform secret store when those providers are enabled.
- Build the frontend with `VITE_API_BASE_URL` pointing at the API base URL. The
  production nginx image serves the SPA and proxies `/api/` to the `backend`
  Compose service; a different hosting topology requires an equivalent proxy or
  absolute API URL.

## Release procedure

1. Build and scan the backend and frontend images.
2. Run `python manage.py migrate --noinput` against the deployment database during
   a controlled release window.
3. Start the backend, worker, beat, and frontend services.
4. Verify `GET /api/health/`, authentication, a patient dashboard, and an
   authorized caregiver dashboard through the deployed host.
5. Record the verified URL, image versions, migration result, and rollback target
   in the release notes. Keep a database backup before migrations and retain the
   previous image for rollback.

No deployment URL, production database migration, or live verification is claimed
in this milestone.

Deployment credentials belong in GitHub Secrets or your cloud provider's secret
store. Never in this folder.
