"""
DeepShield AI — Auth Schemas
Pydantic models for request/response validation
"""

from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


# ── Register ───────────────────────────────────────────────

class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("first_name", "last_name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


# ── Login ──────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── Token response ─────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


# ── Password change ────────────────────────────────────────

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


# ── Profile update ─────────────────────────────────────────

class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


# ── Settings update ────────────────────────────────────────

class SettingsUpdateRequest(BaseModel):
    default_detection: Optional[str] = None
    results_per_page: Optional[int] = None
    confidence_threshold: Optional[int] = None
    retention_period: Optional[int] = None


# ── Webhook ────────────────────────────────────────────────

class WebhookRequest(BaseModel):
    url: str
    secret: Optional[str] = None
    events: Optional[list] = []