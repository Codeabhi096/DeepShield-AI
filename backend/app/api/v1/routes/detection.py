"""
DeepShield AI — Detection Route
POST /api/v1/detect
GET  /api/v1/detect/{job_id}
"""

from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.services import detection_service

router = APIRouter()


@router.post("")
async def start_detection(
    body: dict,
    user_id: str = Depends(get_current_user),
):
    job_id         = body.get("job_id")
    detection_type = body.get("type", "video")

    if not job_id:
        return {"error": "job_id is required"}

    result = await detection_service.run_detection(job_id, user_id)
    return result


@router.get("/{job_id}")
async def get_detection_status(
    job_id: str,
    user_id: str = Depends(get_current_user),
):
    from config.database import get_db
    from bson import ObjectId

    db  = get_db()
    job = await db.detection_jobs.find_one({"_id": ObjectId(job_id)})

    if not job or str(job["user_id"]) != user_id:
        return {"error": "Job not found"}

    return {
        "job_id": job_id,
        "status": job["status"],
        "detection_type": job["detection_type"],
        "file_name": job["file_name"],
        "created_at": str(job["created_at"]),
        "error_message": job.get("error_message"),
    }