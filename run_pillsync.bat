@echo off
echo Starting PillSync Prescription OCR Server...
start "" "http://127.0.0.1:8000/ocr/"
"C:\Users\hp\OneDrive\Documents\PillSync1\venv\Scripts\python.exe" manage.py runserver 127.0.0.1:8000
pause
