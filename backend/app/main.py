import sys
from pathlib import Path

# Automatically ensure project root and backend dir are in module search path
_backend_dir = Path(__file__).resolve().parent.parent
_project_root = _backend_dir.parent
for _p in (str(_project_root), str(_backend_dir)):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.api.v1.router import api_router

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Deterministic documentation quality and engineering platform API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "status": "online",
        "documentation": "/api/docs",
        "health": "/api/health",
        "frontend_ui": "http://localhost:5173",
        "message": "Clarity Backend API is running. Open http://localhost:5173 for the frontend application, or /api/docs for interactive Swagger API documentation."
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Clarity Backend",
        "version": "1.0.0"
    }
