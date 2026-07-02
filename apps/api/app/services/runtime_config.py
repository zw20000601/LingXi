from app.core.config import settings
from app.core.db import db


async def get_app_setting(key: str) -> str:
    if not db.is_connected():
        await db.connect()
    row = await db.appsetting.find_unique(where={"key": key})
    return row.value if row and row.value else ""


async def first_config_value(*keys: str) -> str:
    for key in keys:
        value = await get_app_setting(key)
        if value:
            return value
    return ""


async def get_openai_api_key() -> str:
    return (
        await first_config_value("contentApiKey", "imageApiKey", "speechApiKey")
        or settings.openai_api_key
        or ""
    )


async def get_content_api_config() -> dict[str, str]:
    return {
        "api_key": await first_config_value("contentApiKey", "imageApiKey", "speechApiKey") or settings.openai_api_key or "",
        "base_url": await get_app_setting("contentApiBaseUrl"),
        "model": await get_app_setting("contentModel") or settings.openai_copy_model,
    }


async def get_image_api_config() -> dict[str, str]:
    return {
        "api_key": await first_config_value("imageApiKey", "contentApiKey") or settings.openai_api_key or "",
        "base_url": await get_app_setting("imageApiBaseUrl"),
        "model": await get_app_setting("imageModel"),
    }


async def get_speech_api_config() -> dict[str, str]:
    return {
        "api_key": await first_config_value("speechApiKey", "contentApiKey") or settings.openai_api_key or "",
        "base_url": await get_app_setting("speechApiBaseUrl"),
        "model": await get_app_setting("speechModel") or settings.openai_transcribe_model,
    }


async def get_rapidapi_key() -> str:
    return await first_config_value("rapidApiKey", "videoParseApiKey", "copyExtractApiKey") or settings.rapidapi_key or ""


async def get_video_parse_config() -> dict[str, str]:
    return {
        "provider": await get_app_setting("videoParseProvider") or settings.video_parse_provider,
        "api_key": await first_config_value("videoParseApiKey", "rapidApiKey", "copyExtractApiKey") or settings.rapidapi_key or "",
        "base_url": await get_app_setting("videoParseApiBaseUrl"),
        "bili_cookie": await get_app_setting("biliCookie"),
        "douyin_cookie": await get_app_setting("douyinCookie"),
        "xhs_cookie": await get_app_setting("xhsCookie"),
    }


async def get_siliconflow_api_key() -> str:
    return await get_app_setting("siliconflowApiKey")


async def get_smtp_config() -> dict[str, str]:
    return {
        "host": await get_app_setting("smtpHost"),
        "port": await get_app_setting("smtpPort"),
        "user": await get_app_setting("smtpUser"),
        "password": await get_app_setting("smtpPassword"),
        "secure": (await get_app_setting("smtpSecure") or "ssl").lower(),
        "from_name": await get_app_setting("smtpFromName") or "灵析",
    }
