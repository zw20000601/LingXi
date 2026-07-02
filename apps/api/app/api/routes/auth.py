import secrets
import time

from fastapi import APIRouter, HTTPException, status

from app.core.db import db
from app.core.config import settings
from app.core.deps import is_admin_user
from app.core.security import create_access_token, hash_password, verify_password
from app.models.schemas import AuthPayload, AuthResponse, RegisterPayload, SendCodePayload, SendCodeResponse
from app.services.mailer import send_verification_code_email

router = APIRouter()
VERIFICATION_CODES: dict[str, tuple[str, float]] = {}
CODE_TTL_SECONDS = 600


def serialize_user(user) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "membership_status": str(user.membership_status),
        "is_admin": is_admin_user(user),
    }


@router.post("/send-code", response_model=SendCodeResponse)
async def send_code(payload: SendCodePayload):
    existing = await db.user.find_unique(where={"email": payload.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    code = f"{secrets.randbelow(1_000_000):06d}"
    VERIFICATION_CODES[payload.email] = (code, time.time() + CODE_TTL_SECONDS)

    sent = await send_verification_code_email(payload.email, code)
    if not sent and settings.app_env != "development":
        VERIFICATION_CODES.pop(payload.email, None)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="SMTP is not configured")

    response: dict[str, str | int | None] = {"message": "Verification code sent", "expires_in": CODE_TTL_SECONDS}
    if settings.app_env == "development":
        response["code"] = code
    return response


@router.post("/register", response_model=AuthResponse)
async def register(payload: RegisterPayload):
    existing = await db.user.find_unique(where={"email": payload.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    saved = VERIFICATION_CODES.get(payload.email)
    if not saved:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please send verification code first")

    code, expires_at = saved
    if time.time() > expires_at:
        VERIFICATION_CODES.pop(payload.email, None)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code has expired")

    if payload.verification_code.strip() != code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

    user = await db.user.create(data={"email": payload.email, "password_hash": hash_password(payload.password)})
    VERIFICATION_CODES.pop(payload.email, None)
    return {"access_token": create_access_token(user.id), "user": serialize_user(user)}


@router.post("/login", response_model=AuthResponse)
async def login(payload: AuthPayload):
    user = await db.user.find_unique(where={"email": payload.email})
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    return {"access_token": create_access_token(user.id), "user": serialize_user(user)}
