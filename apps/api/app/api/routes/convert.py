from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile

from app.core.config import settings
from app.core.db import db
from app.core.deps import current_user
from app.services.files import save_upload
from app.services.job_queue import enqueue_convert_file
from app.services.limits import enforce_daily_job_limit, enforce_upload_size

router = APIRouter()


@router.post("/convert")
async def convert(
    background_tasks: BackgroundTasks,
    target_format: str = Form(...),
    file: UploadFile | None = File(default=None),
    user=Depends(current_user),
):
    await enforce_daily_job_limit(user.id)
    if not file:
        raise HTTPException(status_code=400, detail="File upload is required")
    await enforce_upload_size(file)

    input_file = await save_upload(file, user.id)
    job = await db.job.create(
        data={
            "type": "CONVERT",
            "status": "PENDING",
            "input": {"target_format": target_format},
            "input_file_id": input_file.id,
            "user_id": user.id,
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=settings.file_ttl_hours),
        }
    )
    enqueue_convert_file(background_tasks, job.id, input_file.storage_path, target_format, user.id)
    return {"job_id": job.id, "status": job.status}
