import asyncio
from app.services.job_handlers import (
    convert_file_handler,
    parse_video_handler,
    rewrite_copy_handler,
    transcribe_video_handler,
)
from app.tasks.celery_app import celery_app


@celery_app.task(name="parse_video_job")
def parse_video_job(job_id: str, url: str, platform: str | None = None):
    return asyncio.run(parse_video_handler(job_id, url, platform))


@celery_app.task(name="rewrite_copy_job")
def rewrite_copy_job(job_id: str, text: str, instruction: str):
    return asyncio.run(rewrite_copy_handler(job_id, text, instruction))


@celery_app.task(name="convert_file_job")
def convert_file_job(job_id: str, input_path: str, target_format: str, user_id: str):
    return asyncio.run(convert_file_handler(job_id, input_path, target_format, user_id))


@celery_app.task(name="transcribe_video_job")
def transcribe_video_job(job_id: str, file_path: str | None = None, source_url: str | None = None):
    return asyncio.run(transcribe_video_handler(job_id, file_path, source_url))
