# Azure Deployment Guide for PillSync

This guide details deploying the PillSync medication management system to Microsoft Azure.

## Recommended Azure Services

- **Azure Container Apps / App Service**: Host Docker containers for backend API and frontend SPA
- **Azure Database for PostgreSQL**: Managed relational database
- **Azure Cosmos DB (MongoDB API)**: Serverless document store for logs & user profiles
- **Azure Cache for Redis**: Celery message broker & session caching

## Quick Deployment Commands

```bash
# 1. Log in to Azure CLI and Azure Container Registry (ACR)
az login
az acr login --name pillsyncacr

# 2. Build and push container images
az acr build --registry pillsyncacr --image pillsync-backend:latest ./backend
az acr build --registry pillsyncacr --image pillsync-frontend:latest ./frontend

# 3. Create Azure Container App Environment
az containerapp env create \
  --name pillsync-env \
  --resource-group pillsync-rg \
  --location eastus

# 4. Deploy Backend Container App
az containerapp create \
  --name pillsync-backend \
  --resource-group pillsync-rg \
  --environment pillsync-env \
  --image pillsyncacr.azurecr.io/pillsync-backend:latest \
  --target-port 8000 \
  --ingress external

# 5. Deploy Frontend Container App
az containerapp create \
  --name pillsync-frontend \
  --resource-group pillsync-rg \
  --environment pillsync-env \
  --image pillsyncacr.azurecr.io/pillsync-frontend:latest \
  --target-port 80 \
  --ingress external
```
