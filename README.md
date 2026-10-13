# 💊 PillSync - Smart Medicine Companion

Welcome to the integrated repository for **PillSync**, a full-stack web application designed to help users and caregivers manage medical routines and track health data seamlessly.

## 🚀 Live Production Links

* **Frontend Application (Live Site):** [https://pillsync-med.onrender.com](https://pillsync-med.onrender.com)
* **Backend API Base URL:** [https://pillsync-care.onrender.com](https://pillsync-care.onrender.com)
* **API Documentation (Swagger UI):** [https://pillsync-care.onrender.com/docs](https://pillsync-care.onrender.com/docs)

## 🛠️ Tech Stack & Architecture

This project utilizes a decoupled client-server architecture, fully deployed on the cloud using **Render**.

**Frontend (Client)**
* **Framework:** React.js (Vite)
* **Routing/State:** React Router
* **Hosting:** Render (Static Site)

**Backend (Server)**
* **Framework:** Python / FastAPI
* **Security:** bcrypt (Cryptographic password hashing), JWT Authentication
* **Database:** PostgreSQL
* **Hosting:** Render (Web Service)

## 📁 Repository Structure

This is a monorepo containing both the user interface and the server logic:

* `/frontend` - Contains all React components, views, and Vite configurations. It communicates dynamically with the backend via environment variables (`VITE_API_URL`).
* `/backend` - Contains the FastAPI application, database schemas, Alembic migrations, and security utility functions.

## ⚙️ Cloud Deployment Notes (Milestone 4)
* The application utilizes dynamic environment routing. The frontend is configured to automatically route API requests to the `/api/v1` endpoints of the live backend server.
* The backend database connection string and secure JWT keys are managed strictly through Render environment secrets for maximum security.
