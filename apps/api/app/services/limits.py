from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.core.db import db


async def enforce_upload_size(file: UploadFile) -> None:
    size = file.size or 0
    if size > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.max_upload_mb}MB limit",
        )


async def enforce_daily_job_limit(user_id: str) -> None:
    since = datetime.now(timezone.utc) - timedelta(days=1)
    count = await db.job.count(where={"user_id": user_id, "created_at": {"gte": since}})
    if count >= settings.daily_job_limit:
        raise HTTPException(status_code=429, detail="Daily job limit reached")
