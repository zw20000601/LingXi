from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

import aiofiles
from fastapi import UploadFile

from app.core.config import settings
from app.core.db import db


def expires_at() -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=settings.file_ttl_hours)


async def save_upload(file: UploadFile, user_id: str) -> object:
    suffix = Path(file.filename or "upload.bin").suffix
    storage_path = settings.storage_path / "uploads" / f"{uuid4()}{suffix}"
    size = 0

    async with aiofiles.open(storage_path, "wb") as output:
      while chunk := await file.read(1024 * 1024):
          size += len(chunk)
          await output.write(chunk)

    return await db.fileasset.create(
        data={
            "original_name": file.filename or "upload.bin",
            "storage_path": str(storage_path),
            "mime_type": file.content_type,
            "size_bytes": size,
            "user_id": user_id,
            "expires_at": expires_at(),
        }
    )


async def register_output(path: Path, user_id: str, original_name: str, mime_type: str | None = None) -> object:
    return await db.fileasset.create(
        data={
            "original_name": original_name,
            "storage_path": str(path),
            "mime_type": mime_type,
            "size_bytes": path.stat().st_size,
            "user_id": user_id,
            "expires_at": expires_at(),
        }
    )
