from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.core.db import db
from app.core.deps import current_user

router = APIRouter()


@router.get("/{file_id}/download")
async def download_file(file_id: str, user=Depends(current_user)):
    asset = await db.fileasset.find_unique(where={"id": file_id})
    if not asset or asset.user_id != user.id:
        raise HTTPException(status_code=404, detail="File not found")
    if asset.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="File has expired")

    path = Path(asset.storage_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File is missing")

    return FileResponse(path, media_type=asset.mime_type, filename=asset.original_name)
