from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends

from app.core.config import settings
from app.core.db import db
from app.core.deps import current_user
from app.models.schemas import CopyRewriteRequest
from app.services.job_queue import enqueue_rewrite_copy
from app.services.limits import enforce_daily_job_limit

router = APIRouter()


@router.post("/rewrite")
async def rewrite_copy(payload: CopyRewriteRequest, background_tasks: BackgroundTasks, user=Depends(current_user)):
    await enforce_daily_job_limit(user.id)
    job = await db.job.create(
        data={
            "type": "COPY_REWRITE",
            "status": "PENDING",
            "input": {"instruction": payload.instruction},
            "user_id": user.id,
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=settings.file_ttl_hours),
        }
    )
    enqueue_rewrite_copy(background_tasks, job.id, payload.text, payload.instruction)
    return {"job_id": job.id, "status": job.status}
