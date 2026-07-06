"""
DeepShield AI — Results Routes
GET /api/v1/results
GET /api/v1/results/stats
GET /api/v1/results/recent
GET /api/v1/results/{job_id}
"""

from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user
from config.database import get_db
from bson import ObjectId

router = APIRouter()


def serialize(doc):
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc


# ── Get all results (paginated) ────────────────────────────
@router.get("")
async def get_results(
    page:   int = Query(1, ge=1),
    limit:  int = Query(8, ge=1, le=50),
    type:   str = Query(None),
    search: str = Query(None),
    user_id: str = Depends(get_current_user),
):
    db = get_db()

    query = {"user_id": user_id}
    if type:
        query["detection_type"] = type
    if search:
        query["file_name"] = {"$regex": search, "$options": "i"}

    total = await db.detection_results.count_documents(query)
    skip  = (page - 1) * limit

    cursor = db.detection_results.find(query).sort("created_at", -1).skip(skip).limit(limit)
    items  = []

    async for doc in cursor:
        items.append({
            "job_id":           doc.get("job_id"),
            "file_name":        doc.get("file_name"),
            "detection_type":   doc.get("detection_type"),
            "is_deepfake":      doc.get("is_deepfake"),
            "confidence_score": doc.get("confidence_score"),
            "authenticity_score": doc.get("authenticity_score"),
            "status":           "completed",
            "created_at":       str(doc.get("created_at", "")),
        })

    return {"results": items, "total": total, "page": page, "limit": limit}


# ── Dashboard stats ────────────────────────────────────────
@router.get("/stats")
async def get_stats(user_id: str = Depends(get_current_user)):
    db   = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})

    total = await db.detection_results.count_documents({"user_id": user_id})
    fakes = await db.detection_results.count_documents({"user_id": user_id, "is_deepfake": True})

    # Avg confidence
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$confidence_score"}}},
    ]
    avg_result = await db.detection_results.aggregate(pipeline).to_list(1)
    avg_conf   = round(avg_result[0]["avg"], 1) if avg_result else 0

    used  = user.get("detections_used", 0) if user else 0
    limit = user.get("detections_limit", 5) if user else 5

    return {
        "total_detections":  total,
        "fakes_found":       fakes,
        "avg_confidence":    avg_conf,
        "confidence_trend":  2.3,
        "detections_used":   used,
        "detections_limit":  limit,
        "detections_left":   max(0, limit - used),
        "this_week":         0,
    }


# ── Recent detections ──────────────────────────────────────
@router.get("/recent")
async def get_recent(
    limit: int = Query(4, ge=1, le=20),
    user_id: str = Depends(get_current_user),
):
    db     = get_db()
    cursor = db.detection_results.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
    items  = []

    async for doc in cursor:
        items.append({
            "job_id":         doc.get("job_id"),
            "file_name":      doc.get("file_name"),
            "detection_type": doc.get("detection_type"),
            "is_deepfake":    doc.get("is_deepfake"),
            "confidence_score": doc.get("confidence_score"),
            "created_at":     str(doc.get("created_at", "")),
        })

    return items


# ── Single result by job_id ────────────────────────────────
@router.get("/{job_id}")
async def get_result(
    job_id: str,
    user_id: str = Depends(get_current_user),
):
    db  = get_db()
    doc = await db.detection_results.find_one({"job_id": job_id, "user_id": user_id})

    if not doc:
        # Check if job is still processing
        job = await db.detection_jobs.find_one({"_id": ObjectId(job_id)})
        if job:
            return {
                "job_id":         job_id,
                "status":         job.get("status", "pending"),
                "file_name":      job.get("file_name"),
                "detection_type": job.get("detection_type"),
            }
        return {"error": "Result not found"}

    return {
        "job_id":             doc.get("job_id"),
        "file_name":          doc.get("file_name"),
        "detection_type":     doc.get("detection_type"),
        "is_deepfake":        doc.get("is_deepfake"),
        "confidence_score":   doc.get("confidence_score"),
        "authenticity_score": doc.get("authenticity_score"),
        "processing_time_ms": doc.get("processing_time_ms"),
        "model_version":      doc.get("model_version"),
        "explanation":        doc.get("explanation"),
        "status":             "completed",
        "created_at":         str(doc.get("created_at", "")),
    }


# ── Export all results ─────────────────────────────────────
@router.get("/export")
async def export_results(user_id: str = Depends(get_current_user)):
    db     = get_db()
    cursor = db.detection_results.find({"user_id": user_id}).sort("created_at", -1)
    items  = []

    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doc["created_at"] = str(doc.get("created_at", ""))
        items.append(doc)

    return {"results": items, "total": len(items)}