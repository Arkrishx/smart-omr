import os
import cv2
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.session import engine, Base
from app.api import exams, omr, analytics

# Ensure tables are created
Base.metadata.create_all(bind=engine)

# Ensure upload and template dirs exist
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
TEMPLATE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "omr_templates"))
SAMPLE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample_data"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(TEMPLATE_DIR, exist_ok=True)
os.makedirs(SAMPLE_DIR, exist_ok=True)

app = FastAPI(
    title="Smart OMR API",
    description="AI/Computer Vision Powered Smartphone OMR Evaluation System",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file mounts
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
if os.path.exists(TEMPLATE_DIR):
    app.mount("/omr_templates", StaticFiles(directory=TEMPLATE_DIR), name="omr_templates")
if os.path.exists(SAMPLE_DIR):
    app.mount("/sample_data", StaticFiles(directory=SAMPLE_DIR), name="sample_data")

# Include Routers
app.include_router(exams.router)
app.include_router(omr.router)
app.include_router(analytics.router)

@app.get("/api/demo/samples")
def get_demo_samples():
    return {
        "samples": [
            {
                "id": "demo_1",
                "title": "Perfect Upright Scan",
                "filename": "demo_1_perfect.jpg",
                "url": "/sample_data/demo_1_perfect.jpg",
                "description": "High resolution, sharp lighting, 46 questions marked, 2 unanswered, 2 wrong."
            },
            {
                "id": "demo_2",
                "title": "Tilted Perspective (Angled Photo)",
                "filename": "demo_2_tilted.jpg",
                "url": "/sample_data/demo_2_tilted.jpg",
                "description": "Photographed at ~20° angle on desk. Demonstrates automatic homography & perspective correction."
            },
            {
                "id": "demo_3",
                "title": "Uneven Shadow / Low Light",
                "filename": "demo_3_dark_lighting.jpg",
                "url": "/sample_data/demo_3_dark_lighting.jpg",
                "description": "Captured in dim lighting with shadow gradient. Tests CLAHE and division normalization."
            },
            {
                "id": "demo_4",
                "title": "Partial / Light Pencil Marks",
                "filename": "demo_4_partial_marks.jpg",
                "url": "/sample_data/demo_4_partial_marks.jpg",
                "description": "Light marks with paper noise. Tests adaptive fill thresholding."
            },
            {
                "id": "demo_5",
                "title": "Ambiguous / Multiple Marks",
                "filename": "demo_5_ambiguous.jpg",
                "url": "/sample_data/demo_5_ambiguous.jpg",
                "description": "Multiple bubbles marked on Q4, Q18, Q37. Tests review flagging instead of blind guessing."
            }
        ]
    }

@app.get("/api/omr/templates")
def list_available_templates():
    files = []
    if os.path.exists(TEMPLATE_DIR):
        for f in os.listdir(TEMPLATE_DIR):
            if f.endswith((".png", ".pdf", ".json")):
                files.append({
                    "filename": f,
                    "url": f"/omr_templates/{f}",
                    "type": "pdf" if f.endswith(".pdf") else "png" if f.endswith(".png") else "json"
                })
    return {"templates": files}

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "app": "Smart OMR",
        "version": "1.0.0",
        "opencv_version": cv2.__version__,
        "database": "connected",
        "timestamp": os.path.getmtime(__file__) if os.path.exists(__file__) else None
    }

from fastapi.responses import FileResponse

# Production SPA Static Mounting
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API routes, static mounts, or docs
        if full_path.startswith(("api", "uploads", "omr_templates", "sample_data", "docs", "openapi.json")):
            raise HTTPException(status_code=404, detail="Endpoint not found")
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend build not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
