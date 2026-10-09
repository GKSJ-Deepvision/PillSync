@echo off
echo ========================================================
echo       Starting PillSync Backend and Frontend Servers
echo ========================================================

echo Starting Django Backend on port 8000...
start "PillSync Backend (Port 8000)" cmd /k "cd backend && python manage.py runserver 127.0.0.1:8000"

echo Starting Vite Frontend on port 5173...
start "PillSync Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo Both servers are starting!
echo Open your browser to:
echo   http://localhost:5173/login.html
echo.
echo Demo Accounts:
echo   Patient:   patient@pillsync.com   / Password123!
echo   Caregiver: caregiver@pillsync.com / Password123!
echo   Admin:     admin@pillsync.com     / AdminPass123!
echo ========================================================
pause
