from app.core.config import settings
from app.core.db import db
from app.core.security import hash_password


async def ensure_admin_user() -> None:
    email = settings.admin_email.strip().lower()
    password = settings.admin_initial_password
    if not email or not password:
        return

    existing = await db.user.find_unique(where={"email": email})
    if existing:
        return

    await db.user.create(
        data={
            "email": email,
            "password_hash": hash_password(password),
            "membership_status": "ADMIN",
        }
    )
