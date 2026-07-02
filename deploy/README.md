# Linux 部署说明

以下示例以 Ubuntu 22.04/24.04、项目目录 `/opt/lingxi`、运行用户 `lingxi` 为例。

## 1. 系统依赖

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nodejs npm postgresql redis-server nginx libreoffice poppler-utils
```

安装后端依赖：

```bash
cd /opt/lingxi/apps/api
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python -m playwright install chromium
```

安装前端依赖：

```bash
cd /opt/lingxi/apps/web
npm install
npm run build
```

初始化数据库：

```bash
cd /opt/lingxi/apps/api
. .venv/bin/activate
python -m prisma generate --schema ../../prisma/schema.prisma
python -m prisma db push --schema ../../prisma/schema.prisma
```

## 2. 环境变量

复制 `.env.example` 为 `/opt/lingxi/apps/api/.env`，至少修改：

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `RAPIDAPI_KEY`
- `STORAGE_DIR=/opt/lingxi/storage`

前端生产环境需要：

```bash
NEXT_PUBLIC_API_BASE_URL=https://你的域名
```

## 3. systemd

复制 `deploy/systemd/*.service` 到 `/etc/systemd/system/`，按实际路径和用户修改后执行：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now lingxi-api lingxi-worker lingxi-cleaner.timer lingxi-web
```

## 4. Nginx

复制 `deploy/nginx/lingxi.conf` 到 `/etc/nginx/sites-available/lingxi.conf`，修改域名后启用：

```bash
sudo ln -s /etc/nginx/sites-available/lingxi.conf /etc/nginx/sites-enabled/lingxi.conf
sudo nginx -t
sudo systemctl reload nginx
```
