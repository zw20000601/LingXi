from celery import Celery

from app.core.config import settings

celery_app = Celery("lingxi", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.task_track_started = True
celery_app.conf.timezone = "Asia/Shanghai"

import app.tasks.jobs  # noqa: E402,F401
