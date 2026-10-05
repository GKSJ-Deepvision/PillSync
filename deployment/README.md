# PillSync Deployment & Cloud Environment Setup

This directory contains the production deployment configurations, container scripts, reverse proxy settings, and cloud deployment guides for PillSync.

## Directory Overview

| Directory / File | Description & Links |
|---|---|
| [`docker/`](file:///c:/Users/Yogesh%20Y%20Pagar/Desktop/InfosysSpringboard/PillSync/deployment/docker/) | Container entrypoint scripts and runtime environments |
| [`nginx/`](file:///c:/Users/Yogesh%20Y%20Pagar/Desktop/InfosysSpringboard/PillSync/deployment/nginx/) | Nginx reverse proxy routing `/api/` to Django and serving Vite React SPA |
| [`cloud/aws/`](file:///c:/Users/Yogesh%20Y%20Pagar/Desktop/InfosysSpringboard/PillSync/deployment/cloud/aws/) | [AWS ECS Task Definition & App Runner Guide](file:///c:/Users/Yogesh%20Y%20Pagar/Desktop/InfosysSpringboard/PillSync/deployment/cloud/aws/deploy-aws.md) |
| [`cloud/azure/`](file:///c:/Users/Yogesh%20Y%20Pagar/Desktop/InfosysSpringboard/PillSync/deployment/cloud/azure/) | [Azure Container Apps & App Service Guide](file:///c:/Users/Yogesh%20Y%20Pagar/Desktop/InfosysSpringboard/PillSync/deployment/cloud/azure/deploy-azure.md) |
| [`scripts/`](file:///c:/Users/Yogesh%20Y%20Pagar/Desktop/InfosysSpringboard/PillSync/deployment/scripts/) | [deploy.sh](file:///c:/Users/Yogesh%20Y%20Pagar/Desktop/InfosysSpringboard/PillSync/deployment/scripts/deploy.sh) script for building and launching docker containers |

## Local Production Container Run

```bash
# Build and run the entire stack with Docker Compose
docker compose up --build
```

Access the application at: `http://localhost:5173` (Frontend) and `http://localhost:8000/api/` (Backend).
