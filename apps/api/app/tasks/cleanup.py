import asyncio
from datetime import datetime, timezone
from pathlib import Path

from app.core.db import db


async def cleanup_expired_files() -> int:
    if not db.is_connected():
        await db.connect()

    now = datetime.now(timezone.utc)
    files = await db.fileasset.find_many(where={"expires_at": {"lt": now}})
    removed = 0
    for asset in files:
        path = Path(asset.storage_path)
        if path.exists():
            path.unlink()
            removed += 1
        await db.fileasset.delete(where={"id": asset.id})
    return removed


if __name__ == "__main__":
    print(asyncio.run(cleanup_expired_files()))
