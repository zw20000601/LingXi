import httpx

from app.services.runtime_config import get_video_parse_config
from app.services.video_platforms import detect_platform

RAPIDAPI_HOSTS = {
    "douyin": "douyin-video-download.p.rapidapi.com",
    "bilibili": "bilibili-video-download.p.rapidapi.com",
    "xiaohongshu": "xiaohongshu-api.p.rapidapi.com",
}


async def parse_video(url: str, platform: str | None = None) -> dict:
    resolved_platform = (platform or detect_platform(url)).lower()
    if resolved_platform == "unknown":
        raise ValueError("Unsupported video platform")

    config = await get_video_parse_config()
    provider = (config["provider"] or "rapidapi").lower()
    if provider != "rapidapi":
        raise ValueError("Unsupported video parse provider")

    host = RAPIDAPI_HOSTS.get(resolved_platform)
    if not host:
        raise ValueError(f"No RapidAPI adapter for {resolved_platform}")
    rapidapi_key = config["api_key"]
    if not rapidapi_key:
        raise ValueError("RapidAPI Key is not configured")

    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        response = await client.get(
            f"https://{host}/",
            params={"url": url},
            headers={"X-RapidAPI-Key": rapidapi_key, "X-RapidAPI-Host": host},
        )
        response.raise_for_status()

    return {"platform": resolved_platform, "source_url": url, "provider": host, "data": response.json()}
