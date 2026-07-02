from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from app.core.db import db
from app.core.deps import current_admin
from app.core.security import hash_password, verify_password

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


def mask_secret(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "*" * len(value)
    return f"{value[:4]}{'*' * 6}{value[-4:]}"


async def upsert_setting(key: str, value: str):
    if key not in CONFIG_FIELD_MAP:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown config key: {key}")

    existing = await db.appsetting.find_unique(where={"key": key})
    if existing:
        return await db.appsetting.update(where={"key": key}, data={"value": value.strip()})
    return await db.appsetting.create(data={"key": key, "value": value.strip()})


async def get_config() -> dict[str, str]:
    rows = await db.appsetting.find_many()
    config = {key: "" for key in CONFIG_KEYS}
    updated_at_values: list[datetime] = []

    for row in rows:
        if row.key in config:
            config[row.key] = row.value or ""
            updated_at = as_dt(getattr(row, "updated_at", None))
            if updated_at:
                updated_at_values.append(updated_at)

    config["updatedAt"] = max(updated_at_values).isoformat() if updated_at_values else ""
    return config


def config_status(config: dict[str, str]) -> dict[str, Any]:
    fields = []
    configured = 0

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

    return {
        "configured": configured,
        "total": len(CONFIG_FIELDS),
        "updatedAt": config.get("updatedAt", ""),
        "fields": fields,
    }


@router.get("/dashboard")
async def dashboard():
    users = await db.user.find_many(order={"created_at": "desc"})
    jobs = await db.job.find_many(order={"created_at": "desc"}, take=1000)
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
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        trend.append(
            {
                "date": day.strftime("%m-%d"),
                "requests": sum(1 for _, created_at in job_dates if created_at and created_at.date() == day),
            }
        )

    type_counts = Counter(job_type_label(str(job.type)) for job in jobs)
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
    status_payload = config_status(api_config)

    return {
        "stats": {
            "todayRequests": len(today_jobs),
            "yesterdayRequests": len(yesterday_jobs),
            "activeUsers": len(active_user_ids),
            "totalUsers": len(users),
            "newUsersToday": len(new_users_today),
            "cardUsed": 0,
            "cardTotal": 0,
            "apiSuccessRate": round((len(successful_jobs) / len(jobs)) * 100, 2) if jobs else 0,
        },
        "trend": trend,
        "moduleShares": [{"name": name, "value": count} for name, count in type_counts.most_common()],
        "recentActivities": recent_activities,
        "recentUsers": [
            {
                "email": user.email,
                "membershipStatus": str(user.membership_status),
                "createdAt": as_dt(user.created_at).isoformat() if as_dt(user.created_at) else "",
            }
            for user in users[:8]
        ],
        "apiOverview": {
            "configured": status_payload["configured"],
            "total": status_payload["total"],
            "updatedAt": status_payload["updatedAt"],
        },
        "announcements": [],
    }


@router.get("/config")
async def read_config():
    return await get_config()


@router.get("/config/schema")
async def read_config_schema():
    return {"fields": [field.model_dump() for field in CONFIG_FIELDS]}


@router.get("/config/status")
async def read_config_status():
    return config_status(await get_config())


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


@router.post("/config/test/{name}")
async def test_config(name: str):
    if name not in CONFIG_FIELD_MAP:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Config key not found")

    config = await get_config()
    value = config.get(name, "")
    field = CONFIG_FIELD_MAP[name]
    if value:
        return {
            "ok": True,
            "message": f"{field.label}已配置，可以发起真实连通性测试",
            "configured": True,
            "valuePreview": mask_secret(value) if field.secret else value,
        }

    return {
        "ok": False,
        "message": f"{field.label}未配置",
        "configured": False,
        "valuePreview": "",
    }
