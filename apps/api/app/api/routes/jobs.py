from fastapi import APIRouter, Depends, HTTPException

from app.core.db import db
from app.core.deps import current_user

router = APIRouter()


async def serialize_file(file_id: str | None):
    if not file_id:
        return None
    file_asset = await db.fileasset.find_unique(where={"id": file_id})
    if not file_asset:
        return None
    return {
        "id": file_asset.id,
        "original_name": file_asset.original_name,
        "mime_type": file_asset.mime_type,
        "size_bytes": file_asset.size_bytes,
        "created_at": file_asset.created_at.isoformat(),
        "expires_at": file_asset.expires_at.isoformat(),
    }


async def serialize_job(job):
    job_type = str(job.type).split(".")[-1]
    status = str(job.status).split(".")[-1]
    return {
        "id": job.id,
        "type": job_type,
        "status": status,
        "input": job.input,
        "result": job.result,
        "error": job.error,
        "input_file": await serialize_file(getattr(job, "input_file_id", None)),
        "output_file": await serialize_file(getattr(job, "output_file_id", None)),
        "created_at": job.created_at.isoformat(),
        "expires_at": job.expires_at.isoformat(),
    }


@router.get("")
async def list_jobs(limit: int = 20, user=Depends(current_user)):
    limit = max(1, min(limit, 100))
    jobs = await db.job.find_many(where={"user_id": user.id}, order={"created_at": "desc"}, take=limit)
    return [await serialize_job(job) for job in jobs]


@router.get("/{job_id}")
async def get_job(job_id: str, user=Depends(current_user)):
    job = await db.job.find_unique(where={"id": job_id})
    if not job or job.user_id != user.id:
        raise HTTPException(status_code=404, detail="Job not found")
    return await serialize_job(job)


@router.delete("/{job_id}")
async def delete_job(job_id: str, user=Depends(current_user)):
    job = await db.job.find_unique(where={"id": job_id})
    if not job or job.user_id != user.id:
        raise HTTPException(status_code=404, detail="Job not found")
    await db.job.delete(where={"id": job_id})
    return {"ok": True}
