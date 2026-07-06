"""
DeepShield AI — Detection Service
Runs detection on uploaded file
Currently: Mock detection (ML models in Phase 3)
"""

import time
import random
from pathlib import Path
from bson import ObjectId
from datetime import datetime, timezone

from app.db.models import result_document
from app.core.exceptions import NotFoundException
from config.database import get_db


async def run_detection(job_id: str, user_id: str) -> dict:
    db  = get_db()
    job = await db.detection_jobs.find_one({"_id": ObjectId(job_id)})

    if not job:
        raise NotFoundException("Job not found")

    if str(job["user_id"]) != user_id:
        raise NotFoundException("Job not found")

    # Mark as processing
    await db.detection_jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"status": "processing", "updated_at": datetime.now(timezone.utc)}},
    )

    start_time = time.time()

    try:
        # ── Mock detection logic ─────────────────────────
        # TODO: Replace with real ML model in Phase 3
        # Currently returns random result for UI testing
        detection_type = job["detection_type"]
        file_path      = Path(job["file_path"])

        # Simulate processing time (0.5 - 2 seconds)
        time.sleep(random.uniform(0.5, 2.0))

        # Mock result
        is_deepfake        = random.random() > 0.5
        confidence_score   = random.uniform(60, 99) if is_deepfake else random.uniform(5, 35)
        authenticity_score = round(100 - confidence_score if is_deepfake else 100 - confidence_score * 0.3, 1)
        processing_time_ms = int((time.time() - start_time) * 1000)

        explanation = {
            "heatmap_url": None,
            "attention_regions": [],
            "confidence_per_frame": [],
            "summary": (
                f"The {detection_type} was analyzed using our ensemble model. "
                f"{'Manipulation artifacts were detected in key regions.' if is_deepfake else 'No significant manipulation artifacts were detected.'}"
            ),
        }

        # Save result
        result = result_document(
            job_id=job_id,
            user_id=user_id,
            detection_type=detection_type,
            file_name=job["file_name"],
            is_deepfake=is_deepfake,
            confidence_score=round(confidence_score, 2),
            authenticity_score=authenticity_score,
            processing_time_ms=processing_time_ms,
            model_version="mock-v1.0",
            explanation=explanation,
        )

        await db.detection_results.insert_one(result)

        # Mark job as completed
        await db.detection_jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {
                "status": "completed",
                "updated_at": datetime.now(timezone.utc),
                "completed_at": datetime.now(timezone.utc),
            }},
        )

        # Increment user's detection count
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$inc": {"detections_used": 1}},
        )

        return {
            "job_id": job_id,
            "status": "completed",
            "file_name": job["file_name"],
            "detection_type": detection_type,
            "is_deepfake": is_deepfake,
            "confidence_score": round(confidence_score, 2),
            "authenticity_score": authenticity_score,
            "processing_time_ms": processing_time_ms,
            "explanation": explanation,
            "model_version": "mock-v1.0",
            "created_at": str(datetime.now(timezone.utc)),
        }

    except Exception as e:
        # Mark job as failed
        await db.detection_jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {
                "status": "failed",
                "error_message": str(e),
                "updated_at": datetime.now(timezone.utc),
            }},
        )
        raise