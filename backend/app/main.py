"""
DeepShield AI — FastAPI Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path

from app.core.config import settings
from app.core.exceptions import add_exception_handlers
from app.api.v1.routes import auth, upload, detection, results, health
from config.database import connect_db, disconnect_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    # Create upload directory
    Path("data/uploads").mkdir(parents=True, exist_ok=True)
    print(f"✅ DeepShield AI started — {settings.APP_ENV} mode")
    yield
    await disconnect_db()
    print("👋 Shutting down")


app = FastAPI(
    title="DeepShield AI",
    description="Enterprise-grade deepfake detection API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

add_exception_handlers(app)

app.include_router(health.router,    tags=["Health"])
app.include_router(auth.router,      prefix="/api/v1/auth",    tags=["Auth"])
app.include_router(upload.router,    prefix="/api/v1/upload",  tags=["Upload"])
app.include_router(detection.router, prefix="/api/v1/detect",  tags=["Detection"])
app.include_router(results.router,   prefix="/api/v1/results", tags=["Results"])


@app.get("/")
async def root():
    return {"name": "DeepShield AI", "status": "running", "docs": "/docs"}