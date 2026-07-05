"""
DeepShield AI — MongoDB Document Models
"""

from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId


def utc_now():
    return datetime.now(timezone.utc)


# ── User document ──────────────────────────────────────────

def user_document(
    first_name: str,
    last_name: str,
    email: str,
    hashed_password: str,
    api_key: str,
    plan: str = "free",
) -> dict:
    return {
        "first_name": first_name,
        "last_name": last_name,
        "email": email.lower().strip(),
        "hashed_password": hashed_password,
        "api_key": api_key,
        "plan": plan,
        "detections_used": 0,
        "detections_limit": 50,
        "phone": None,
        "is_active": True,
        "settings": {
            "default_detection": "video",
            "results_per_page": 8,
            "confidence_threshold": 50,
            "retention_period": 30,
            "notifications": {
                "emailComplete": False,
                "deepfakeAlert": True,
                "weeklySummary": True,
                "usageWarning": True,
                "productUpdates": False,
            },
        },
        "webhook": None,
        "created_at": utc_now(),
        "updated_at": utc_now(),
    }


# ── Detection job document ─────────────────────────────────

def job_document(
    user_id: str,
    detection_type: str,
    file_name: str,
    file_size: int,
    file_path: str,
) -> dict:
    return {
        "user_id": user_id,
        "detection_type": detection_type,
        "status": "pending",
        "file_name": file_name,
        "file_size": file_size,
        "file_path": file_path,
        "file_url": None,
        "error_message": None,
        "created_at": utc_now(),
        "updated_at": utc_now(),
        "completed_at": None,
    }


# ── Detection result document ──────────────────────────────

def result_document(
    job_id: str,
    user_id: str,
    detection_type: str,
    file_name: str,
    is_deepfake: bool,
    confidence_score: float,
    authenticity_score: float,
    processing_time_ms: int,
    model_version: str = "v1.0",
    explanation: Optional[dict] = None,
) -> dict:
    return {
        "job_id": job_id,
        "user_id": user_id,
        "detection_type": detection_type,
        "file_name": file_name,
        "is_deepfake": is_deepfake,
        "confidence_score": round(confidence_score, 2),
        "authenticity_score": round(authenticity_score, 2),
        "manipulated_regions": [],
        "explanation": explanation or {
            "heatmap_url": None,
            "attention_regions": [],
            "confidence_per_frame": [],
            "summary": None,
        },
        "processing_time_ms": processing_time_ms,
        "model_version": model_version,
        "created_at": utc_now(),
    }


# ── Helper — serialize ObjectId ────────────────────────────

def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB _id to string for JSON response"""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc