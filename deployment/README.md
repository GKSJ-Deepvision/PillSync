# Deployment

| Path | Purpose |
|---|---|
| `docker/` | Extra Dockerfiles and entrypoint scripts beyond the app-level ones |
| `nginx/` | Reverse proxy and static file serving config |
| `cloud/aws/` | AWS deployment notes, task definitions, IaC |
| `cloud/azure/` | Azure deployment notes, App Service / Container Apps config |
| `scripts/` | Build, migrate, seed and release helper scripts |

Milestone 4 requires a deployed application. Record the live URL and the deployment
steps you actually used in `docs/demo/` — a deployment nobody else can reproduce
does not count.

**The reference implementation's deployment assets live at the repository root, not
here:** [`docker-compose.prod.yml`](../docker-compose.prod.yml) (the production
topology), [`render.yaml`](../render.yaml) (a Render blueprint),
[`backend/Dockerfile`](../backend/Dockerfile), [`frontend/nginx.conf`](../frontend/nginx.conf),
[`scripts/smoke_test.py`](../scripts/smoke_test.py), and the guide
[`docs/deployment.md`](../docs/deployment.md). Read them before writing your own.

Deployment credentials belong in GitHub Secrets or your cloud provider's secret
store. Never in this folder.
