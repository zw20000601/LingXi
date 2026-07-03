import json
import secrets
import smtplib
import urllib.error
import urllib.request
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from app.core.db import db
from app.core.deps import current_admin
from app.core.security import hash_password, verify_password
from app.services.runtime_config import get_smtp_config

router = APIRouter(dependencies=[Depends(current_admin)])


class ConfigField(BaseModel):
    key: str
    label: str
    group: str
    secret: bool = False
    multiline: bool = False
    placeholder: str = ""
    description: str = ""


CONFIG_FIELDS: tuple[ConfigField, ...] = (
    ConfigField(
        key="contentApiKey",
        label="文案生成 API Key",
        group="content",
        secret=True,
        placeholder="sk-...",
        description="用于文案生成、文案改写、标题脚本等文本类能力。",
    ),
    ConfigField(
        key="contentApiBaseUrl",
        label="文案生成接口地址",
        group="content",
        placeholder="https://api.openai.com/v1",
        description="兼容 OpenAI 格式的接口地址，可留空使用默认服务。",
    ),
    ConfigField(
        key="contentModel",
        label="文案生成模型",
        group="content",
        placeholder="gpt-4o / agnes-2.0-flash",
    ),
    ConfigField(
        key="imageApiKey",
        label="图片生成 API Key",
        group="image",
        secret=True,
        placeholder="sk-...",
        description="用于文本生图、图片改图等图片生成能力。",
    ),
    ConfigField(
        key="imageApiBaseUrl",
        label="图片生成接口地址",
        group="image",
        placeholder="https://api.openai.com/v1",
    ),
    ConfigField(
        key="imageModel",
        label="图片生成模型",
        group="image",
        placeholder="gpt-image-1 / agnes-image-2.1-flash",
    ),
    ConfigField(
        key="speechApiKey",
        label="语音/转写 API Key",
        group="speech",
        secret=True,
        placeholder="sk-...",
        description="用于语音转文字、字幕提取、配音等能力。",
    ),
    ConfigField(
        key="speechApiBaseUrl",
        label="语音接口地址",
        group="speech",
        placeholder="https://api.openai.com/v1",
    ),
    ConfigField(
        key="speechModel",
        label="语音转写模型",
        group="speech",
        placeholder="whisper-1",
    ),
    ConfigField(
        key="copyExtractApiKey",
        label="文案提取 API Key",
        group="video",
        secret=True,
        placeholder="RapidAPI / SiliconFlow / 解析服务 Key",
        description="兼容旧字段，现阶段视频解析会优先读取这个字段。",
    ),
    ConfigField(
        key="videoParseProvider",
        label="视频解析服务商",
        group="video",
        placeholder="rapidapi",
    ),
    ConfigField(
        key="videoParseApiKey",
        label="视频解析 API Key",
        group="video",
        secret=True,
        placeholder="视频解析服务的 Key",
    ),
    ConfigField(
        key="videoParseApiBaseUrl",
        label="视频解析接口地址",
        group="video",
        placeholder="https://...",
    ),
    ConfigField(
        key="rapidApiKey",
        label="RapidAPI Key",
        group="video",
        secret=True,
        placeholder="RapidAPI Key",
    ),
    ConfigField(
        key="siliconflowApiKey",
        label="SiliconFlow API Key",
        group="video",
        secret=True,
        placeholder="sk-...",
        description="可用于语音识别、字幕提取等媒体处理。",
    ),
    ConfigField(
        key="biliCookie",
        label="B站 Cookie",
        group="platform",
        secret=True,
        multiline=True,
        placeholder="SESSDATA=...; bili_jct=...",
    ),
    ConfigField(
        key="douyinCookie",
        label="抖音 Cookie",
        group="platform",
        secret=True,
        multiline=True,
    ),
    ConfigField(
        key="xhsCookie",
        label="小红书 Cookie",
        group="platform",
        secret=True,
        multiline=True,
    ),
    ConfigField(
        key="wechatSupportId",
        label="客服微信号",
        group="support",
        placeholder="hg91587",
    ),
    ConfigField(key="smtpHost", label="SMTP 服务器", group="mail", placeholder="smtp.qq.com"),
    ConfigField(key="smtpPort", label="SMTP 端口", group="mail", placeholder="465"),
    ConfigField(key="smtpUser", label="发信邮箱账号", group="mail", placeholder="example@qq.com"),
    ConfigField(key="smtpPassword", label="SMTP 授权密码", group="mail", secret=True),
    ConfigField(key="smtpSecure", label="SMTP 加密方式", group="mail", placeholder="ssl / tls"),
    ConfigField(key="smtpFromName", label="发件人名称", group="mail", placeholder="灵析"),
)

CONFIG_FIELD_MAP = {field.key: field for field in CONFIG_FIELDS}
CONFIG_KEYS = tuple(CONFIG_FIELD_MAP.keys())
SECRET_KEYS = {field.key for field in CONFIG_FIELDS if field.secret}
CUSTOM_CONFIG_KEY = "__custom_config_fields"


class AdminConfigPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contentApiKey: str | None = None
    contentApiBaseUrl: str | None = None
    contentModel: str | None = None
    imageApiKey: str | None = None
    imageApiBaseUrl: str | None = None
    imageModel: str | None = None
    speechApiKey: str | None = None
    speechApiBaseUrl: str | None = None
    speechModel: str | None = None
    copyExtractApiKey: str | None = None
    videoParseProvider: str | None = None
    videoParseApiKey: str | None = None
    videoParseApiBaseUrl: str | None = None
    rapidApiKey: str | None = None
    siliconflowApiKey: str | None = None
    biliCookie: str | None = None
    douyinCookie: str | None = None
    xhsCookie: str | None = None
    wechatSupportId: str | None = None
    smtpHost: str | None = None
    smtpPort: str | None = None
    smtpUser: str | None = None
    smtpPassword: str | None = None
    smtpSecure: str | None = None
    smtpFromName: str | None = None


class SingleConfigPayload(BaseModel):
    key: str = Field(min_length=1)
    value: str = ""


class AdminPasswordPayload(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class UserStatusPayload(BaseModel):
    is_disabled: bool


class CardGeneratePayload(BaseModel):
    type: str = Field(min_length=1, max_length=20)
    quota: int = Field(ge=1, le=100000)
    valid_days: int = Field(ge=1, le=3650)
    count: int = Field(ge=1, le=200)
    prefix: str = Field(default="LK", min_length=1, max_length=10)


class AnnouncementPayload(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    type: str = Field(min_length=1, max_length=30)
    status: str = Field(default="DRAFT", min_length=1, max_length=20)
    content: str = Field(min_length=1, max_length=5000)


class CustomConfigPayload(BaseModel):
    key: str = Field(min_length=1, max_length=80)
    label: str = Field(min_length=1, max_length=80)
    group: str = Field(default="custom", min_length=1, max_length=40)
    value: str = ""
    endpoint: str = ""
    secret: bool = False
    description: str = ""


def as_dt(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


def job_type_label(job_type: str) -> str:
    value = job_type.split(".")[-1]
    return {
        "CONVERT": "文档转换",
        "COPY_REWRITE": "文案处理",
        "VIDEO_PARSE": "视频处理",
        "VIDEO_TRANSCRIBE": "视频处理",
    }.get(value, value)


def job_action_label(job_type: str) -> str:
    value = job_type.split(".")[-1]
    return {
        "CONVERT": "文件转换",
        "COPY_REWRITE": "文案改写",
        "VIDEO_PARSE": "视频解析",
        "VIDEO_TRANSCRIBE": "文案提取",
    }.get(value, "任务处理")


def status_label(status_value: str) -> str:
    value = status_value.split(".")[-1]
    return {
        "PENDING": "排队中",
        "RUNNING": "处理中",
        "SUCCEEDED": "成功",
        "FAILED": "失败",
    }.get(value, value)


def serialize_user(user) -> dict[str, Any]:
    created_at = as_dt(getattr(user, "created_at", None))
    return {
        "id": user.id,
        "email": user.email,
        "username": user.email.split("@")[0],
        "membershipStatus": enum_value(getattr(user, "membership_status", "FREE")),
        "isDisabled": to_bool(getattr(user, "is_disabled", False)),
        "createdAt": created_at.isoformat() if created_at else "",
    }


def serialize_card(card) -> dict[str, Any]:
    created_at = as_dt(getattr(card, "created_at", None))
    updated_at = as_dt(getattr(card, "updated_at", None))
    expires_at = as_dt(getattr(card, "expires_at", None))
    used_at = as_dt(getattr(card, "used_at", None))
    return {
        "id": card.id,
        "code": card.code,
        "type": card.type,
        "quota": card.quota,
        "validDays": card.valid_days,
        "status": getattr(card, "status", "UNUSED"),
        "usedBy": getattr(card, "used_by", None) or "",
        "usedAt": used_at.isoformat() if used_at else "",
        "expiresAt": expires_at.isoformat() if expires_at else "",
        "createdAt": created_at.isoformat() if created_at else "",
        "updatedAt": updated_at.isoformat() if updated_at else "",
    }


def serialize_announcement(item) -> dict[str, Any]:
    created_at = as_dt(getattr(item, "created_at", None))
    updated_at = as_dt(getattr(item, "updated_at", None))
    return {
        "id": item.id,
        "title": item.title,
        "type": item.type,
        "status": getattr(item, "status", "DRAFT"),
        "content": getattr(item, "content", ""),
        "createdAt": created_at.isoformat() if created_at else "",
        "updatedAt": updated_at.isoformat() if updated_at else "",
        "time": updated_at.isoformat() if updated_at else created_at.isoformat() if created_at else "",
    }


def mask_secret(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "*" * len(value)
    return f"{value[:4]}{'*' * 6}{value[-4:]}"


def enum_value(value: Any) -> str:
    return str(value).split(".")[-1]


def status_value(value: str) -> str:
    return value.strip().upper().replace(" ", "_")


def to_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return bool(value)
    if isinstance(value, str):
        return value.lower() in {"1", "true", "yes", "on"}
    return False


async def get_custom_fields() -> list[dict[str, Any]]:
    row = await db.appsetting.find_unique(where={"key": CUSTOM_CONFIG_KEY})
    if not row or not getattr(row, "value", None):
        return []
    try:
        value = json.loads(row.value)
    except json.JSONDecodeError:
        return []
    return value if isinstance(value, list) else []


async def save_custom_fields(fields: list[dict[str, Any]]):
    payload = json.dumps(fields, ensure_ascii=False)
    existing = await db.appsetting.find_unique(where={"key": CUSTOM_CONFIG_KEY})
    if existing:
        return await db.appsetting.update(where={"key": CUSTOM_CONFIG_KEY}, data={"value": payload})
    return await db.appsetting.create(data={"key": CUSTOM_CONFIG_KEY, "value": payload})


async def upsert_setting(key: str, value: str):
    custom_keys = {field.get("key") for field in await get_custom_fields()}
    if key not in CONFIG_FIELD_MAP and key not in custom_keys and not key.startswith("custom."):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown config key: {key}")

    existing = await db.appsetting.find_unique(where={"key": key})
    if existing:
        return await db.appsetting.update(where={"key": key}, data={"value": value.strip()})
    return await db.appsetting.create(data={"key": key, "value": value.strip()})


async def get_config() -> dict[str, str]:
    rows = await db.appsetting.find_many()
    custom_fields = await get_custom_fields()
    config = {key: "" for key in CONFIG_KEYS}
    for field in custom_fields:
        key = field.get("key")
        if isinstance(key, str):
            config[key] = ""
    updated_at_values: list[datetime] = []

    for row in rows:
        if row.key in config:
            config[row.key] = row.value or ""
            updated_at = as_dt(getattr(row, "updated_at", None))
            if updated_at:
                updated_at_values.append(updated_at)

    config["updatedAt"] = max(updated_at_values).isoformat() if updated_at_values else ""
    config["customFields"] = custom_fields
    return config


async def config_status(config: dict[str, str]) -> dict[str, Any]:
    fields = []
    configured = 0

    custom_fields = await get_custom_fields()
    for field in CONFIG_FIELDS:
        value = config.get(field.key, "")
        if value:
            configured += 1
        fields.append(
            {
                **field.model_dump(),
                "configured": bool(value),
                "valuePreview": mask_secret(value) if field.secret else value,
            }
        )

    for field in custom_fields:
        key = field.get("key", "")
        value = config.get(key, "")
        if value:
            configured += 1
        fields.append({**field, "configured": bool(value), "valuePreview": mask_secret(value) if field.get("secret") else value})

    return {
        "configured": configured,
        "total": len(CONFIG_FIELDS) + len(custom_fields),
        "updatedAt": config.get("updatedAt", ""),
        "fields": fields,
    }


@router.get("/dashboard")
async def dashboard():
    users = await db.user.find_many(order={"created_at": "desc"})
    jobs = await db.job.find_many(order={"created_at": "desc"}, take=1000)
    cards = await db.cardkey.find_many(order={"created_at": "desc"})
    announcements = await db.announcement.find_many(order={"updated_at": "desc"}, take=10)
    now = datetime.now(timezone.utc)
    today = now.date()
    yesterday = today - timedelta(days=1)

    job_dates = [(job, as_dt(job.created_at)) for job in jobs]
    today_jobs = [job for job, created_at in job_dates if created_at and created_at.date() == today]
    yesterday_jobs = [job for job, created_at in job_dates if created_at and created_at.date() == yesterday]
    successful_jobs = [job for job in jobs if str(job.status).split(".")[-1] == "SUCCEEDED"]
    active_user_ids = {
        job.user_id
        for job, created_at in job_dates
        if created_at and created_at >= now - timedelta(days=7)
    }
    new_users_today = [user for user in users if (created_at := as_dt(user.created_at)) and created_at.date() == today]

    trend: list[dict[str, int | str]] = []
    for offset in range(29, -1, -1):
        day = today - timedelta(days=offset)
        trend.append(
            {
                "date": day.strftime("%m-%d"),
                "requests": sum(1 for _, created_at in job_dates if created_at and created_at.date() == day),
            }
        )

    type_counts = Counter(job_type_label(str(job.type)) for job in jobs)
    raw_type_counts = Counter(enum_value(job.type) for job in jobs)
    recent_activities = [
        {
            "time": created_at.isoformat() if created_at else "",
            "module": job_type_label(str(job.type)),
            "action": job_action_label(str(job.type)),
            "status": status_label(str(job.status)),
        }
        for job, created_at in job_dates[:10]
    ]

    api_config = await get_config()
    status_payload = await config_status(api_config)

    return {
        "stats": {
            "todayRequests": len(today_jobs),
            "yesterdayRequests": len(yesterday_jobs),
            "activeUsers": len(active_user_ids),
            "totalUsers": len(users),
            "newUsersToday": len(new_users_today),
            "cardUsed": sum(1 for card in cards if enum_value(getattr(card, "status", "")) == "USED"),
            "cardTotal": len(cards),
            "apiSuccessRate": round((len(successful_jobs) / len(jobs)) * 100, 2) if jobs else 0,
        },
        "trend": trend,
        "moduleShares": [{"name": name, "value": count} for name, count in type_counts.most_common()],
        "functionRank": [
            {
                "name": job_type_label(name),
                "type": name,
                "count": count,
                "share": round((count / len(jobs)) * 100, 2) if jobs else 0,
            }
            for name, count in raw_type_counts.most_common()
        ],
        "recentActivities": recent_activities,
        "recentUsers": [
            {
                "id": user.id,
                "email": user.email,
                "membershipStatus": str(user.membership_status),
                "isDisabled": to_bool(getattr(user, "is_disabled", False)),
                "createdAt": as_dt(user.created_at).isoformat() if as_dt(user.created_at) else "",
            }
            for user in users[:8]
        ],
        "apiOverview": {
            "configured": status_payload["configured"],
            "total": status_payload["total"],
            "updatedAt": status_payload["updatedAt"],
        },
        "announcements": [serialize_announcement(item) for item in announcements],
    }


@router.get("/users")
async def list_users():
    users = await db.user.find_many(order={"created_at": "desc"})
    return [serialize_user(user) for user in users]


@router.patch("/users/{user_id}/status")
async def update_user_status(user_id: str, payload: UserStatusPayload, admin_user=Depends(current_admin)):
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == admin_user.id and payload.is_disabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot disable current admin")
    updated = await db.user.update(where={"id": user_id}, data={"is_disabled": payload.is_disabled})
    return serialize_user(updated)


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(user_id: str):
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    temp_password = "123456789"
    await db.user.update(where={"id": user_id}, data={"password_hash": hash_password(temp_password)})
    return {"temporaryPassword": temp_password}


@router.get("/cards")
async def list_cards():
    cards = await db.cardkey.find_many(order={"created_at": "desc"})
    return [serialize_card(card) for card in cards]


@router.post("/cards/generate")
async def generate_cards(payload: CardGeneratePayload):
    cards = []
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=payload.valid_days)
    for _ in range(payload.count):
        code = f"{payload.prefix.upper()}{now.strftime('%Y%m%d')}{secrets.token_hex(4).upper()}"
        card = await db.cardkey.create(
            data={
                "code": code,
                "type": payload.type,
                "quota": payload.quota,
                "valid_days": payload.valid_days,
                "status": "UNUSED",
                "expires_at": expires_at,
            }
        )
        cards.append(serialize_card(card))
    return {"cards": cards}


@router.delete("/cards/{card_id}")
async def delete_card(card_id: str):
    card = await db.cardkey.delete(where={"id": card_id})
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    return {"message": "Card deleted"}


@router.get("/announcements")
async def list_announcements():
    rows = await db.announcement.find_many(order={"updated_at": "desc"})
    return [serialize_announcement(item) for item in rows]


@router.post("/announcements")
async def create_announcement(payload: AnnouncementPayload):
    row = await db.announcement.create(
        data={
            "title": payload.title.strip(),
            "type": payload.type.strip(),
            "status": status_value(payload.status),
            "content": payload.content.strip(),
        }
    )
    return serialize_announcement(row)


@router.put("/announcements/{announcement_id}")
async def update_announcement(announcement_id: str, payload: AnnouncementPayload):
    existing = await db.announcement.find_unique(where={"id": announcement_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")
    row = await db.announcement.update(
        where={"id": announcement_id},
        data={
            "title": payload.title.strip(),
            "type": payload.type.strip(),
            "status": status_value(payload.status),
            "content": payload.content.strip(),
        },
    )
    return serialize_announcement(row)


@router.delete("/announcements/{announcement_id}")
async def delete_announcement(announcement_id: str):
    item = await db.announcement.delete(where={"id": announcement_id})
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")
    return {"message": "Announcement deleted"}


@router.get("/config")
async def read_config():
    return await get_config()


@router.get("/config/schema")
async def read_config_schema():
    return {"fields": [field.model_dump() for field in CONFIG_FIELDS] + await get_custom_fields()}


@router.get("/config/status")
async def read_config_status():
    return await config_status(await get_config())


@router.put("/config")
async def save_config(payload: AdminConfigPayload):
    values = payload.model_dump(exclude_unset=True)
    for key, value in values.items():
        await upsert_setting(key, value or "")
    return await get_config()


@router.patch("/config")
async def patch_config(payload: SingleConfigPayload):
    await upsert_setting(payload.key, payload.value)
    return await get_config()


@router.post("/config/custom")
async def create_custom_config(payload: CustomConfigPayload):
    key = payload.key.strip()
    if key in CONFIG_FIELD_MAP or key in {"updatedAt", "customFields", CUSTOM_CONFIG_KEY}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Config key already exists")
    if not key.startswith("custom."):
        key = f"custom.{key}"

    fields = await get_custom_fields()
    next_field = {
        "key": key,
        "label": payload.label.strip(),
        "group": payload.group.strip() or "custom",
        "secret": payload.secret,
        "placeholder": payload.endpoint.strip(),
        "description": payload.description.strip(),
    }
    fields = [field for field in fields if field.get("key") != key] + [next_field]
    await save_custom_fields(fields)
    await upsert_setting(key, payload.value)
    return await get_config()


@router.put("/password")
async def change_admin_password(payload: AdminPasswordPayload, user=Depends(current_admin)):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be different")

    await db.user.update(
        where={"id": user.id},
        data={"password_hash": hash_password(payload.new_password)},
    )
    return {"message": "Admin password updated"}


def get_test_pair(name: str) -> tuple[str, str | None]:
    pairs = {
        "contentApiKey": "contentApiBaseUrl",
        "imageApiKey": "imageApiBaseUrl",
        "speechApiKey": "speechApiBaseUrl",
        "copyExtractApiKey": "videoParseApiBaseUrl",
        "videoParseApiKey": "videoParseApiBaseUrl",
        "rapidApiKey": "videoParseApiBaseUrl",
        "siliconflowApiKey": "speechApiBaseUrl",
    }
    return name, pairs.get(name)


def probe_openai_compatible(base_url: str, api_key: str) -> tuple[bool, str]:
    target = base_url.rstrip("/")
    if not target.endswith("/models"):
        target = f"{target}/models"
    request = urllib.request.Request(target, headers={"Authorization": f"Bearer {api_key}"})
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            if 200 <= response.status < 300:
                return True, "接口连通成功"
            return False, f"接口返回 HTTP {response.status}"
    except urllib.error.HTTPError as exc:
        return False, f"接口返回 HTTP {exc.code}"
    except Exception as exc:
        return False, f"接口连接失败：{exc}"


def probe_smtp(config: dict[str, str]) -> tuple[bool, str]:
    host = config.get("host")
    user = config.get("user")
    password = config.get("password")
    port = int(config.get("port") or 465)
    secure = (config.get("secure") or "ssl").lower()
    if not host or not user or not password:
        return False, "SMTP 主机、账号或授权码未完整配置"
    try:
        if secure == "tls":
            with smtplib.SMTP(host, port, timeout=12) as server:
                server.starttls()
                server.login(user, password)
        else:
            with smtplib.SMTP_SSL(host, port, timeout=12) as server:
                server.login(user, password)
        return True, "SMTP 登录测试成功"
    except Exception as exc:
        return False, f"SMTP 测试失败：{exc}"


@router.post("/config/test/{name}")
async def test_config(name: str):
    custom_fields = await get_custom_fields()
    custom_map = {field.get("key"): field for field in custom_fields}
    if name not in CONFIG_FIELD_MAP and name not in custom_map:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Config key not found")

    config = await get_config()
    value = config.get(name, "")
    field = CONFIG_FIELD_MAP.get(name) or ConfigField(**custom_map[name])
    if value:
        if name == "smtpPassword":
            ok, message = probe_smtp(await get_smtp_config())
            return {"ok": ok, "message": message, "configured": True, "valuePreview": mask_secret(value)}

        _, base_key = get_test_pair(name)
        base_url = config.get(base_key or "", "")
        if base_url:
            ok, message = probe_openai_compatible(base_url, value)
            return {"ok": ok, "message": message, "configured": True, "valuePreview": mask_secret(value) if field.secret else value}

        return {
            "ok": True,
            "message": f"{field.label}已配置；如需连通性测试，请同时配置接口地址",
            "configured": True,
            "valuePreview": mask_secret(value) if field.secret else value,
        }

    return {
        "ok": False,
        "message": f"{field.label}未配置",
        "configured": False,
        "valuePreview": "",
    }
