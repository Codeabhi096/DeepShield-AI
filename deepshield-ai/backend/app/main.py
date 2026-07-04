from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.exceptions import add_exception_handlers
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.rate_limit_middleware import RateLimitMiddleware
from app.api.v1.routes import auth, upload, detection, results, health
from config.database import connect_db, disconnect_db


# ── Lifespan (startup + shutdown) ─────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    print(f"✅ DeepShield AI started — {settings.APP_ENV} mode")
    yield
    # Shutdown
    await disconnect_db()
    print("👋 DeepShield AI shutting down")


# ── App ────────────────────────────────────────────────────
app = FastAPI(
    title="DeepShield AI",
    description="Enterprise-grade deepfake detection API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ── CORS ───────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Custom middleware ───────────────────────────────────────
app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimitMiddleware)

# ── Exception handlers ─────────────────────────────────────
add_exception_handlers(app)

# ── Routes ─────────────────────────────────────────────────
app.include_router(health.router,    tags=["Health"])
app.include_router(auth.router,      prefix="/api/v1/auth",    tags=["Auth"])
app.include_router(upload.router,    prefix="/api/v1/upload",  tags=["Upload"])
app.include_router(detection.router, prefix="/api/v1/detect",  tags=["Detection"])
app.include_router(results.router,   prefix="/api/v1/results", tags=["Results"])


# ── Root ───────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "name": "DeepShield AI",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }