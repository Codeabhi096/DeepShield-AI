"""
DeepShield AI — Auth Routes
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
PATCH /api/v1/auth/me
PATCH /api/v1/auth/password
GET  /api/v1/auth/api-key
POST /api/v1/auth/api-key/regenerate
PATCH /api/v1/auth/settings
POST /api/v1/auth/webhook
DELETE /api/v1/auth/me
"""

from fastapi import APIRouter, Depends
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    PasswordChangeRequest,
    ProfileUpdateRequest,
    SettingsUpdateRequest,
    WebhookRequest,
)
from app.services import auth_service
from app.core.security import get_current_user

router = APIRouter()


# ── Register ───────────────────────────────────────────────
@router.post("/register")
async def register(body: RegisterRequest):
    return await auth_service.register_user(
        first_name=body.first_name,
        last_name=body.last_name,
        email=body.email,
        password=body.password,
    )


# ── Login ──────────────────────────────────────────────────
@router.post("/login")
async def login(body: LoginRequest):
    return await auth_service.login_user(
        email=body.email,
        password=body.password,
    )


# ── Get profile ────────────────────────────────────────────
@router.get("/me")
async def get_me(user_id: str = Depends(get_current_user)):
    return await auth_service.get_user_profile(user_id)


# ── Update profile ─────────────────────────────────────────
@router.patch("/me")
async def update_me(
    body: ProfileUpdateRequest,
    user_id: str = Depends(get_current_user),
):
    return await auth_service.update_profile(user_id, body.model_dump())


# ── Delete account ─────────────────────────────────────────
@router.delete("/me")
async def delete_me(user_id: str = Depends(get_current_user)):
    await auth_service.delete_account(user_id)
    return {"message": "Account deleted successfully"}


# ── Change password ────────────────────────────────────────
@router.patch("/password")
async def change_password(
    body: PasswordChangeRequest,
    user_id: str = Depends(get_current_user),
):
    await auth_service.change_password(
        user_id,
        body.current_password,
        body.new_password,
    )
    return {"message": "Password updated successfully"}


# ── Get API key ────────────────────────────────────────────
@router.get("/api-key")
async def get_api_key(user_id: str = Depends(get_current_user)):
    profile = await auth_service.get_user_profile(user_id)
    return {"api_key": profile["api_key"]}


# ── Regenerate API key ─────────────────────────────────────
@router.post("/api-key/regenerate")
async def regen_api_key(user_id: str = Depends(get_current_user)):
    new_key = await auth_service.regenerate_api_key(user_id)
    return {"api_key": new_key}


# ── Update settings ────────────────────────────────────────
@router.patch("/settings")
async def update_settings(
    body: SettingsUpdateRequest,
    user_id: str = Depends(get_current_user),
):
    await auth_service.update_settings(user_id, body.model_dump())
    return {"message": "Settings updated"}


# ── Save webhook ───────────────────────────────────────────
@router.post("/webhook")
async def save_webhook(
    body: WebhookRequest,
    user_id: str = Depends(get_current_user),
):
    from config.database import get_db
    from datetime import datetime, timezone
    db = get_db()
    await db.users.update_one(
        {"_id": __import__("bson").ObjectId(user_id)},
        {"$set": {
            "webhook": body.model_dump(),
            "updated_at": datetime.now(timezone.utc),
        }},
    )
    return {"message": "Webhook saved"}


# ── Test webhook ───────────────────────────────────────────
@router.post("/webhook/test")
async def test_webhook(
    body: dict,
    user_id: str = Depends(get_current_user),
):
    import httpx
    url = body.get("url")
    if not url:
        return {"error": "URL required"}
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(url, json={"event": "test", "source": "DeepShield AI"}, timeout=5)
            return {"status": res.status_code, "message": "Test sent"}
        except Exception as e:
            return {"error": str(e)}


# ── Delete all sessions (placeholder) ─────────────────────
@router.delete("/sessions")
async def delete_sessions(user_id: str = Depends(get_current_user)):
    # TODO: implement token blacklist with Redis
    return {"message": "All other sessions signed out"}