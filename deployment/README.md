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

Deployment credentials belong in GitHub Secrets or your cloud provider's secret
store. Never in this folder.
