from fastapi import BackgroundTasks

from app.services.job_handlers import (
    convert_file_handler,
    parse_video_handler,
    rewrite_copy_handler,
    transcribe_video_handler,
)


def enqueue_parse_video(background_tasks: BackgroundTasks, job_id: str, url: str, platform: str | None) -> None:
    try:
        from app.tasks.jobs import parse_video_job

        parse_video_job.delay(job_id, url, platform)
    except ImportError:
        background_tasks.add_task(parse_video_handler, job_id, url, platform)


def enqueue_rewrite_copy(background_tasks: BackgroundTasks, job_id: str, text: str, instruction: str) -> None:
    try:
        from app.tasks.jobs import rewrite_copy_job

        rewrite_copy_job.delay(job_id, text, instruction)
    except ImportError:
        background_tasks.add_task(rewrite_copy_handler, job_id, text, instruction)


def enqueue_convert_file(
    background_tasks: BackgroundTasks,
    job_id: str,
    input_path: str,
    target_format: str,
    user_id: str,
) -> None:
    try:
        from app.tasks.jobs import convert_file_job

        convert_file_job.delay(job_id, input_path, target_format, user_id)
    except ImportError:
        background_tasks.add_task(convert_file_handler, job_id, input_path, target_format, user_id)


def enqueue_transcribe_video(
    background_tasks: BackgroundTasks,
    job_id: str,
    file_path: str | None,
    source_url: str | None,
) -> None:
    try:
        from app.tasks.jobs import transcribe_video_job

        transcribe_video_job.delay(job_id, file_path, source_url)
    except ImportError:
        background_tasks.add_task(transcribe_video_handler, job_id, file_path, source_url)
