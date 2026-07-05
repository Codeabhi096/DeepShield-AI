"""
DeepShield AI — Auth Service
Business logic for register, login, profile management
"""

from datetime import datetime, timezone
from bson import ObjectId

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    generate_api_key,
)
from app.core.exceptions import (
    UnauthorizedException,
    NotFoundException,
    ValidationException,
)
from app.db.models import user_document, serialize_doc
from config.database import get_db


def utc_now():
    return datetime.now(timezone.utc)


# ── Register ───────────────────────────────────────────────

async def register_user(first_name: str, last_name: str, email: str, password: str) -> dict:
    db = get_db()

    # Check if email already exists
    existing = await db.users.find_one({"email": email.lower().strip()})
    if existing:
        raise ValidationException("Email already registered")

    # Create user document
    hashed_pw = hash_password(password)
    api_key   = generate_api_key()
    doc       = user_document(first_name, last_name, email, hashed_pw, api_key)

    result  = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)

    # Generate tokens
    access_token  = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token({"sub": user_id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "first_name": first_name,
            "last_name": last_name,
            "email": email.lower().strip(),
            "plan": "free",
        },
    }


# ── Login ──────────────────────────────────────────────────

async def login_user(email: str, password: str) -> dict:
    db   = get_db()
    user = await db.users.find_one({"email": email.lower().strip()})

    if not user:
        raise UnauthorizedException("Invalid email or password")

    if not verify_password(password, user["hashed_password"]):
        raise UnauthorizedException("Invalid email or password")

    if not user.get("is_active", True):
        raise UnauthorizedException("Account is deactivated")

    user_id = str(user["_id"])
    access_token  = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token({"sub": user_id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "email": user["email"],
            "plan": user.get("plan", "free"),
        },
    }


# ── Get current user ───────────────────────────────────────

async def get_user_profile(user_id: str) -> dict:
    db   = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise NotFoundException("User not found")

    return {
        "id": str(user["_id"]),
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "email": user["email"],
        "phone": user.get("phone"),
        "plan": user.get("plan", "free"),
        "detections_used": user.get("detections_used", 0),
        "detections_limit": user.get("detections_limit", 50),
        "api_key": user.get("api_key"),
        "settings": user.get("settings", {}),
        "created_at": str(user.get("created_at", "")),
    }


# ── Update profile ─────────────────────────────────────────

async def update_profile(user_id: str, data: dict) -> dict:
    db = get_db()

    update_fields = {k: v for k, v in data.items() if v is not None}
    update_fields["updated_at"] = utc_now()

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_fields},
    )

    return await get_user_profile(user_id)


# ── Change password ────────────────────────────────────────

async def change_password(user_id: str, current_password: str, new_password: str):
    db   = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise NotFoundException("User not found")

    if not verify_password(current_password, user["hashed_password"]):
        raise UnauthorizedException("Current password is incorrect")

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "hashed_password": hash_password(new_password),
            "updated_at": utc_now(),
        }},
    )


# ── Regenerate API key ─────────────────────────────────────

async def regenerate_api_key(user_id: str) -> str:
    db      = get_db()
    new_key = generate_api_key()

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"api_key": new_key, "updated_at": utc_now()}},
    )
    return new_key


# ── Update settings ────────────────────────────────────────

async def update_settings(user_id: str, data: dict):
    db = get_db()
    update = {f"settings.{k}": v for k, v in data.items() if v is not None}
    update["updated_at"] = utc_now()

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update},
    )


# ── Delete account ─────────────────────────────────────────

async def delete_account(user_id: str):
    db = get_db()
    await db.users.delete_one({"_id": ObjectId(user_id)})
    await db.detection_jobs.delete_many({"user_id": user_id})
    await db.detection_results.delete_many({"user_id": user_id})