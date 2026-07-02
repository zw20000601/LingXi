from openai import AsyncOpenAI

from app.services.runtime_config import get_content_api_config


async def rewrite_copy(text: str, instruction: str) -> str:
    api_config = await get_content_api_config()
    api_key = api_config["api_key"]
    if not api_key:
        raise RuntimeError("Content API Key is not configured")

    client_kwargs = {"api_key": api_key}
    if api_config["base_url"]:
        client_kwargs["base_url"] = api_config["base_url"]

    client = AsyncOpenAI(**client_kwargs)
    response = await client.chat.completions.create(
        model=api_config["model"],
        messages=[
            {
                "role": "system",
                "content": "你是灵析的中文内容处理助手，输出自然、清晰、可直接发布的文案。",
            },
            {
                "role": "user",
                "content": f"原文：\n{text}\n\n处理要求：\n{instruction}",
            },
        ],
        temperature=0.8,
    )
    return response.choices[0].message.content or ""
