# AWS Deployment Guide for PillSync

This guide details the steps to deploy the PillSync platform using Amazon Web Services (AWS App Runner / ECS Fargate).

## Architecture Overview

- **Frontend**: AWS App Runner / Amazon S3 + CloudFront serving static React build
- **Backend**: AWS App Runner or AWS ECS Fargate container running Django REST API
- **Database**: Amazon RDS PostgreSQL for structured relational data
- **MongoDB**: Amazon DocumentDB (MongoDB compatible API) for log analytics & developer documents
- **Cache/Broker**: Amazon ElastiCache Redis for Celery task queuing

## Step-by-Step Deployment Instructions

### 1. Build and Push Container Images to AWS ECR

```bash
# Login to AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build & tag Backend Image
docker build -t pillsync-backend ./backend
docker tag pillsync-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/pillsync-backend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/pillsync-backend:latest

# Build & tag Frontend Image
docker build -t pillsync-frontend ./frontend
docker tag pillsync-frontend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/pillsync-frontend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/pillsync-frontend:latest
```

### 2. Deploy Backend on AWS App Runner / ECS

1. Create a service in AWS App Runner selecting the ECR container repository `pillsync-backend`.
2. Configure environment variables in AWS App Runner console:
   - `SECRET_KEY`: `<your-production-django-secret>`
   - `DATABASE_URL`: `postgres://user:password@rds-instance.us-east-1.rds.amazonaws.com:5432/pillsync`
   - `MONGO_URI`: `mongodb://username:password@docdb-instance.us-east-1.docdb.amazonaws.com:27017/pillsync`
   - `REDIS_URL`: `redis://elasticache-instance.us-east-1.cache.amazonaws.com:6379/0`
3. Expose port 8000.

### 3. Deploy Frontend on AWS App Runner / Vercel / CloudFront

1. Deploy the `pillsync-frontend` container image to AWS App Runner (Port 80).
2. Configure custom domain or test endpoint: `https://pillsync.awsapprunner.com`.
3. Verify live connection between Frontend SPA and Backend API endpoints.
