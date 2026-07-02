from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile

from app.core.config import settings
from app.core.db import db
from app.core.deps import current_user
from app.models.schemas import VideoParseRequest
from app.services.files import save_upload
from app.services.job_queue import enqueue_parse_video, enqueue_transcribe_video
from app.services.limits import enforce_daily_job_limit, enforce_upload_size
from app.services.video_platforms import detect_platform

router = APIRouter()


def job_expiry():
    return datetime.now(timezone.utc) + timedelta(hours=settings.file_ttl_hours)


@router.post("/parse")
async def parse_video(payload: VideoParseRequest, background_tasks: BackgroundTasks, user=Depends(current_user)):
    await enforce_daily_job_limit(user.id)
    platform = payload.platform or detect_platform(str(payload.url))
    if platform == "unknown":
        raise HTTPException(status_code=400, detail="Unsupported video platform")

    job = await db.job.create(
        data={
            "type": "VIDEO_PARSE",
            "status": "PENDING",
            "input": {"url": str(payload.url), "platform": platform},
            "user_id": user.id,
            "expires_at": job_expiry(),
        }
    )
    enqueue_parse_video(background_tasks, job.id, str(payload.url), platform)
    return {"job_id": job.id, "status": job.status}


@router.post("/transcribe")
async def transcribe_video(
    background_tasks: BackgroundTasks,
    file: UploadFile | None = File(default=None),
    source_url: str | None = Form(default=None),
    user=Depends(current_user),
):
    await enforce_daily_job_limit(user.id)
    if not file and not source_url:
        raise HTTPException(status_code=400, detail="Provide a file or source_url")

    input_file = None
    if file:
        await enforce_upload_size(file)
        input_file = await save_upload(file, user.id)

    job = await db.job.create(
        data={
            "type": "VIDEO_TRANSCRIBE",
            "status": "PENDING",
            "input": {"source_url": source_url},
            "input_file_id": input_file.id if input_file else None,
            "user_id": user.id,
            "expires_at": job_expiry(),
        }
    )
    enqueue_transcribe_video(background_tasks, job.id, input_file.storage_path if input_file else None, source_url)
    return {"job_id": job.id, "status": job.status}
