# ==========================================
# Multi-Stage Production Dockerfile for Smart OMR
# Stage 1: Build React 18 Frontend
# Stage 2: Production Python 3.11+ OpenCV Environment
# ==========================================

FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --prefer-offline --no-audit || npm install

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Python Backend Runtime
# ==========================================
FROM python:3.12-slim

# Install system dependencies required for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy Backend Source Code
COPY backend/ ./backend/
COPY omr_templates/ ./omr_templates/
COPY sample_data/ ./sample_data/

# Copy Compiled Frontend Assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create uploads directory
RUN mkdir -p ./backend/uploads

WORKDIR /app/backend

# Seed initial demo data and templates on container build
RUN python seed_demo_data.py || true

ENV PORT=8000
ENV HOST=0.0.0.0
EXPOSE 8000

# Start Unified FastAPI Server (Serves API + React SPA)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
