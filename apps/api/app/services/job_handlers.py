from pathlib import Path
from uuid import uuid4

import httpx
from openai import OpenAI

from app.core.config import settings
from app.core.db import db
from app.services.converters import convert_file
from app.services.copywriter import rewrite_copy
from app.services.files import register_output
from app.services.runtime_config import get_speech_api_config
from app.services.video_parsers import parse_video


async def ensure_db_connected() -> None:
    if not db.is_connected():
        await db.connect()


async def parse_video_handler(job_id: str, url: str, platform: str | None = None):
    await ensure_db_connected()
    await db.job.update(where={"id": job_id}, data={"status": "RUNNING"})
    try:
        result = await parse_video(url, platform)
        await db.job.update(where={"id": job_id}, data={"status": "SUCCEEDED", "result": result})
        return result
    except Exception as exc:
        await db.job.update(where={"id": job_id}, data={"status": "FAILED", "error": str(exc)})
        raise


async def rewrite_copy_handler(job_id: str, text: str, instruction: str):
    await ensure_db_connected()
    await db.job.update(where={"id": job_id}, data={"status": "RUNNING"})
    try:
        rewritten = await rewrite_copy(text, instruction)
        result = {"text": rewritten}
        await db.job.update(where={"id": job_id}, data={"status": "SUCCEEDED", "result": result})
        return result
    except Exception as exc:
        await db.job.update(where={"id": job_id}, data={"status": "FAILED", "error": str(exc)})
        raise


async def convert_file_handler(job_id: str, input_path: str, target_format: str, user_id: str):
    await ensure_db_connected()
    await db.job.update(where={"id": job_id}, data={"status": "RUNNING"})
    try:
        output_path = convert_file(Path(input_path), target_format)
        output_file = await register_output(output_path, user_id, output_path.name)
        result = {"file_id": output_file.id, "download_url": f"/api/files/{output_file.id}/download"}
        await db.job.update(
            where={"id": job_id},
            data={"status": "SUCCEEDED", "result": result, "output_file_id": output_file.id},
        )
        return result
    except Exception as exc:
        await db.job.update(where={"id": job_id}, data={"status": "FAILED", "error": str(exc)})
        raise


async def transcribe_video_handler(job_id: str, file_path: str | None = None, source_url: str | None = None):
    await ensure_db_connected()
    await db.job.update(where={"id": job_id}, data={"status": "RUNNING"})
    try:
        path = Path(file_path) if file_path else await download_source(source_url)
        api_config = await get_speech_api_config()
        api_key = api_config["api_key"]
        if not api_key:
            raise RuntimeError("Speech API Key is not configured")
        client_kwargs = {"api_key": api_key}
        if api_config["base_url"]:
            client_kwargs["base_url"] = api_config["base_url"]
        client = OpenAI(**client_kwargs)
        with open(path, "rb") as media:
            text = client.audio.transcriptions.create(
                model=api_config["model"],
                file=media,
                response_format="text",
            )
        result = {"text": text}
        await db.job.update(where={"id": job_id}, data={"status": "SUCCEEDED", "result": result})
        return result
    except Exception as exc:
        await db.job.update(where={"id": job_id}, data={"status": "FAILED", "error": str(exc)})
        raise


async def download_source(source_url: str | None) -> Path:
    if not source_url:
        raise RuntimeError("source_url is required")
    output = settings.storage_path / "uploads" / f"{uuid4()}.mp4"
    async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
        response = await client.get(source_url)
        response.raise_for_status()
    output.write_bytes(response.content)
    return output
