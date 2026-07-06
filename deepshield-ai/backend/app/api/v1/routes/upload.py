"""
DeepShield AI — Upload Route
POST /api/v1/upload
"""

import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pathlib import Path

from app.core.security import get_current_user
from app.core.exceptions import (
    FileTooLargeException,
    UnsupportedFileTypeException,
    DetectionLimitException,
)
from app.core.config import settings
from app.db.models import job_document
from config.database import get_db
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter()

# Upload directory
UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed types
ALLOWED_TYPES = {
    "video":     {"video/mp4", "video/avi", "video/quicktime", "video/x-matroska"},
    "image":     {"image/jpeg", "image/png", "image/webp"},
    "audio":     {"audio/wav", "audio/mpeg", "audio/flac"},
    "face_swap": {"video/mp4", "image/jpeg", "image/png"},
}

MAX_SIZES = {
    "video":     settings.MAX_VIDEO_SIZE_MB * 1024 * 1024,
    "image":     settings.MAX_IMAGE_SIZE_MB * 1024 * 1024,
    "audio":     settings.MAX_AUDIO_SIZE_MB * 1024 * 1024,
    "face_swap": settings.MAX_VIDEO_SIZE_MB * 1024 * 1024,
}


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    detection_type: str = "video",
    user_id: str = Depends(get_current_user),
):
    db   = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check detection limit
    used  = user.get("detections_used", 0)
    limit = user.get("detections_limit", 5)
    if used >= limit:
        raise DetectionLimitException()

    # Validate detection type
    if detection_type not in ALLOWED_TYPES:
        raise UnsupportedFileTypeException(f"Invalid detection type: {detection_type}")

    # Validate file type
    if file.content_type not in ALLOWED_TYPES[detection_type]:
        raise UnsupportedFileTypeException(
            f"Unsupported file type '{file.content_type}' for {detection_type} detection"
        )

    # Read file and check size
    contents = await file.read()
    file_size = len(contents)

    if file_size > MAX_SIZES[detection_type]:
        max_mb = MAX_SIZES[detection_type] // (1024 * 1024)
        raise FileTooLargeException(f"File too large. Max size is {max_mb}MB")

    # Save file locally
    ext       = Path(file.filename).suffix
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path   = UPLOAD_DIR / unique_name

    with open(file_path, "wb") as f:
        f.write(contents)

    # Create job in DB
    job = job_document(
        user_id=user_id,
        detection_type=detection_type,
        file_name=file.filename,
        file_size=file_size,
        file_path=str(file_path),
    )

    result = await db.detection_jobs.insert_one(job)
    job_id = str(result.inserted_id)

    return {
        "job_id": job_id,
        "file_name": file.filename,
        "file_size": file_size,
        "detection_type": detection_type,
        "status": "pending",
    }