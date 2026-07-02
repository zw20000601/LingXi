# Windows Backend Startup

Project path: `G:\Lingxi`.

## Recommended local command

Because this Windows Python/venv launcher can fail after moving folders, start the backend with system Python and the installed dependency path:

```bat
cd /d G:\Lingxi\apps\api
set PYTHONPATH=G:\Lingxi\apps\api\.venv-lingxi\Lib\site-packages;G:\Lingxi\apps\api
C:\Users\17815\AppData\Local\Programs\Python\Python313\python.exe -m uvicorn app.main:app --reload
```

Open:

```text
http://127.0.0.1:8000/docs
```

## If dependencies need reinstalling

```bat
cd /d G:\Lingxi\apps\api
C:\Users\17815\AppData\Local\Programs\Python\Python313\python.exe -m venv .venv-lingxi
set PYTHONPATH=G:\Lingxi\apps\api\.venv-lingxi\Lib\site-packages;G:\Lingxi\apps\api
C:\Users\17815\AppData\Local\Programs\Python\Python313\python.exe -m pip install -r requirements.txt --target G:\Lingxi\apps\api\.venv-lingxi\Lib\site-packages
```

Local development currently uses SQLite:

```env
DB_BACKEND=sqlite
```

PostgreSQL remains configured for later:

```env
DATABASE_URL=postgresql://postgres:lingxi_dev_password@127.0.0.1:5432/lingxi
```

If you still have the old `.venv`, close all old backend terminals first, then delete:

```text
G:\Lingxi\apps\api\.venv
```
