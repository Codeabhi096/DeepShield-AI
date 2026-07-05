"""
DeepShield AI — FastAPI Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.exceptions import add_exception_handlers
from app.api.v1.routes import auth, health
from config.database import connect_db, disconnect_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
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

app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])


@app.get("/")
async def root():
    return {"name": "DeepShield AI", "status": "running", "docs": "/docs"}