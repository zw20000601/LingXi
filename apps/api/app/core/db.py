import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from typing import Any

from app.core.config import settings


def parse_datetime(value: Any) -> Any:
    if isinstance(value, datetime) or value is None:
        return value
    if isinstance(value, str):
        text = value.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(text)
        except ValueError:
            return value
    return value


def encode_json(value: Any) -> str | None:
    if value is None:
        return None
    return json.dumps(value, ensure_ascii=False, default=str)


def decode_json(value: str | None) -> Any:
    if not value:
        return None
    return json.loads(value)


def row_to_object(row: sqlite3.Row | None) -> Any:
    if row is None:
        return None
    data = dict(row)
    for key in ("input", "result"):
        if key in data:
            data[key] = decode_json(data[key])
    for key in ("created_at", "updated_at", "expires_at"):
        if key in data:
            data[key] = parse_datetime(data[key])
    return SimpleNamespace(**data)


class SQLiteTable:
    def __init__(self, db: "SQLiteDB", table: str):
        self.db = db
        self.table = table

    async def find_unique(self, where: dict[str, Any]):
        key, value = next(iter(where.items()))
        row = self.db.conn.execute(f"SELECT * FROM {self.table} WHERE {key} = ?", (value,)).fetchone()
        return row_to_object(row)

    async def find_many(
        self,
        where: dict[str, Any] | None = None,
        order: dict[str, str] | None = None,
        take: int | None = None,
    ):
        params: list[Any] = []
        clauses: list[str] = []
        for key, value in (where or {}).items():
            clauses.append(f"{key} = ?")
            params.append(value)

        sql = f"SELECT * FROM {self.table}"
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        if order:
            field, direction = next(iter(order.items()))
            direction_sql = "DESC" if direction.lower() == "desc" else "ASC"
            sql += f" ORDER BY {field} {direction_sql}"
        if take is not None:
            sql += " LIMIT ?"
            params.append(take)

        rows = self.db.conn.execute(sql, params).fetchall()
        return [row_to_object(row) for row in rows]

    async def create(self, data: dict[str, Any]):
        payload = self.db.prepare_payload(self.table, data)
        keys = list(payload.keys())
        placeholders = ",".join(["?"] * len(keys))
        self.db.conn.execute(
            f"INSERT INTO {self.table} ({','.join(keys)}) VALUES ({placeholders})",
            [payload[key] for key in keys],
        )
        self.db.conn.commit()
        return await self.find_unique({"id": payload["id"]})

    async def update(self, where: dict[str, Any], data: dict[str, Any]):
        key, value = next(iter(where.items()))
        payload = self.db.prepare_payload(self.table, data, include_id=False)
        payload["updated_at"] = datetime.now(timezone.utc).isoformat()
        assignments = ",".join([f"{field} = ?" for field in payload])
        self.db.conn.execute(
            f"UPDATE {self.table} SET {assignments} WHERE {key} = ?",
            [payload[field] for field in payload] + [value],
        )
        self.db.conn.commit()
        return await self.find_unique(where)

    async def delete(self, where: dict[str, Any]):
        item = await self.find_unique(where)
        key, value = next(iter(where.items()))
        self.db.conn.execute(f"DELETE FROM {self.table} WHERE {key} = ?", (value,))
        self.db.conn.commit()
        return item


class SQLiteJobTable(SQLiteTable):
    async def count(self, where: dict[str, Any]):
        params: list[Any] = []
        clauses: list[str] = []
        for key, value in where.items():
            if isinstance(value, dict) and "gte" in value:
                clauses.append(f"{key} >= ?")
                params.append(parse_datetime(value["gte"]).isoformat())
            else:
                clauses.append(f"{key} = ?")
                params.append(value)
        sql = "SELECT COUNT(*) AS total FROM jobs"
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        return self.db.conn.execute(sql, params).fetchone()["total"]


class SQLiteFileTable(SQLiteTable):
    async def find_many(self, where: dict[str, Any]):
        expires = where.get("expires_at", {})
        if "lt" in expires:
            rows = self.db.conn.execute(
                "SELECT * FROM file_assets WHERE expires_at < ?",
                (parse_datetime(expires["lt"]).isoformat(),),
            ).fetchall()
        else:
            rows = self.db.conn.execute("SELECT * FROM file_assets").fetchall()
        return [row_to_object(row) for row in rows]


class SQLiteDB:
    def __init__(self):
        self.conn: sqlite3.Connection | None = None
        self.user = SQLiteTable(self, "users")
        self.job = SQLiteJobTable(self, "jobs")
        self.fileasset = SQLiteFileTable(self, "file_assets")
        self.appsetting = SQLiteTable(self, "app_settings")

    def is_connected(self) -> bool:
        return self.conn is not None

    async def connect(self):
        if self.conn:
            return
        db_path = settings.storage_path / "lingxi.sqlite3"
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA foreign_keys = ON")
        self.create_schema()

    async def disconnect(self):
        if self.conn:
            self.conn.close()
            self.conn = None

    def create_schema(self):
        self.conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                membership_status TEXT NOT NULL DEFAULT 'FREE',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS file_assets (
                id TEXT PRIMARY KEY,
                original_name TEXT NOT NULL,
                storage_path TEXT NOT NULL,
                mime_type TEXT,
                size_bytes INTEGER NOT NULL,
                user_id TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING',
                input TEXT,
                result TEXT,
                error TEXT,
                user_id TEXT NOT NULL,
                input_file_id TEXT,
                output_file_id TEXT,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS app_settings (
                id TEXT PRIMARY KEY,
                key TEXT UNIQUE NOT NULL,
                value TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )
        self.conn.commit()

    def prepare_payload(self, table: str, data: dict[str, Any], include_id: bool = True) -> dict[str, Any]:
        from uuid import uuid4

        now = datetime.now(timezone.utc).isoformat()
        payload = dict(data)
        if include_id:
            payload.setdefault("id", str(uuid4()))
            payload.setdefault("created_at", now)
        if table in {"users", "jobs", "app_settings"}:
            payload.setdefault("updated_at", now)
        if table == "users":
            payload.setdefault("membership_status", "FREE")
        for key in ("input", "result"):
            if key in payload:
                payload[key] = encode_json(payload[key])
        for key in ("created_at", "updated_at", "expires_at"):
            if key in payload and isinstance(payload[key], datetime):
                payload[key] = payload[key].isoformat()
        return payload


if settings.db_backend.lower() == "sqlite":
    db = SQLiteDB()
else:
    try:
        from prisma import Prisma

        db = Prisma()
    except Exception:
        db = SQLiteDB()
