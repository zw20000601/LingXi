from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, auth, convert, copy, files, jobs, video
from app.core.config import settings
from app.core.db import db
from app.services.admin_bootstrap import ensure_admin_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    await ensure_admin_user()
    yield
    await db.disconnect()


app = FastAPI(title="LingXi API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(video.router, prefix="/api/video", tags=["video"])
app.include_router(copy.router, prefix="/api/copy", tags=["copy"])
app.include_router(convert.router, prefix="/api", tags=["convert"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])


@app.get("/health")
async def health():
    return {"status": "ok"}
