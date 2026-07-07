"""
DeepShield AI — App Configuration
All settings loaded from .env file
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):

    # ── App ───────────────────────────────────────────────
    APP_NAME: str = "DeepShield AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000

    # ── MongoDB ───────────────────────────────────────────
    MONGODB_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "deepshield"

    # ── Redis ─────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379"

    # ── AWS S3 ────────────────────────────────────────────
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "deepshield-media"
    AWS_REGION: str = "ap-south-1"

    # ── JWT ───────────────────────────────────────────────
    JWT_SECRET_KEY: str = "change-this-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Celery ────────────────────────────────────────────
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # ── ML Models ─────────────────────────────────────────
    MODEL_DIR: str = "ml_models/pretrained"
    DEVICE: str = "cpu"
    CONFIDENCE_THRESHOLD: float = 0.5

    # ── File Upload Limits ────────────────────────────────
    MAX_VIDEO_SIZE_MB: int = 500
    MAX_IMAGE_SIZE_MB: int = 10
    MAX_AUDIO_SIZE_MB: int = 50
    ALLOWED_VIDEO_TYPES: List[str] = ["mp4", "avi", "mov", "mkv"]
    ALLOWED_IMAGE_TYPES: List[str] = ["jpg", "jpeg", "png", "webp"]
    ALLOWED_AUDIO_TYPES: List[str] = ["wav", "mp3", "flac"]

    # ── CORS ──────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8080",
    ]

    # ── Detection limits ──────────────────────────────────
    FREE_PLAN_LIMIT: int = 50
    PRO_PLAN_LIMIT: int = 2000

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()