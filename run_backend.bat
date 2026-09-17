@echo off
echo Starting Smart OMR FastAPI Backend on port 8000...
cd /d "%~dp0backend"
call .venv\Scripts\activate.bat
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
