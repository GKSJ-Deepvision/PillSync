#!/bin/bash
set -e

echo "=== PillSync Production Deployment Build Script ==="

echo "[1/4] Running Backend Checks & Database Migrations..."
python backend/manage.py check
python backend/manage.py migrate --noinput
python backend/manage.py collectstatic --noinput || true

echo "[2/4] Building Frontend Production SPA Bundle..."
cd frontend
npm run build
cd ..

echo "[3/4] Building Docker Container Images..."
docker compose build

echo "[4/4] Starting PillSync Application Containers..."
docker compose up -d

echo "=== PillSync Deployment Complete! App running at http://localhost:5173 ==="
