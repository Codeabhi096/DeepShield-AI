"""
DeepShield AI — Upload Route
POST /api/v1/upload
"""

import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pathlib import Path

from app.core.security import get_current_user
from app.core.exceptions import FileTooLargeException, DetectionLimitException
from app.core.config import settings
from app.db.models import job_document
from config.database import get_db
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter()

UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_SIZES = {
    "video":     500 * 1024 * 1024,
    "image":     10  * 1024 * 1024,
    "audio":     50  * 1024 * 1024,
    "face_swap": 500 * 1024 * 1024,
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

    # Read file
    contents  = await file.read()
    file_size = len(contents)

    # Check size
    max_size = MAX_SIZES.get(detection_type, 10 * 1024 * 1024)
    if file_size > max_size:
        raise FileTooLargeException(f"File too large. Max: {max_size // (1024*1024)}MB")

    # Save file
    ext         = Path(file.filename).suffix or ".bin"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path   = UPLOAD_DIR / unique_name

    with open(file_path, "wb") as f:
        f.write(contents)

    # Create job
    job    = job_document(
        user_id=user_id,
        detection_type=detection_type,
        file_name=file.filename,
        file_size=file_size,
        file_path=str(file_path),
    )
    result = await db.detection_jobs.insert_one(job)
    job_id = str(result.inserted_id)

    return {
        "job_id":         job_id,
        "file_name":      file.filename,
        "file_size":      file_size,
        "detection_type": detection_type,
        "status":         "pending",
    }