# 灵析 LingXi

登录后使用的实用工具聚合 Web 站：短视频提取、视频文案提取、AI 文案二创、Office/HTML/PDF 互转、PDF 转图片。

## 技术栈

- Frontend: Next.js 14 + Tailwind CSS + TypeScript
- Backend: FastAPI + Celery
- Database: SQLite for local development, PostgreSQL + Prisma for deployment
- Queue/Cache: Redis
- Conversion: LibreOffice, Poppler, Playwright/Chromium
- Auth: JWT

## 本地开发

### 后端

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../../.env.example .env
uvicorn app.main:app --reload
```

另开终端启动 worker：

```bash
cd apps/api
source .venv/bin/activate
celery -A app.tasks.celery_app worker --loglevel=info
```

Windows 启动细节见 `docs/windows-backend.md`。

### 前端

```bash
cd apps/web
npm install
npm run dev
```

访问：

- Web: http://localhost:3000
- API Docs: http://localhost:8000/docs

## Linux 部署

参考 `deploy/README.md`。第一阶段不依赖 Docker，使用 systemd 管理 `api`、`worker`、`beat/file-cleaner`、`web`。
