from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    db_backend: str = "sqlite"
    database_url: str = "postgresql://lingxi:lingxi_dev_password@localhost:5432/lingxi"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "change-this-before-production"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 60 * 24 * 7
    admin_email: str = ""
    admin_initial_password: str | None = None
    cors_origins: str = "http://localhost:3000"
    storage_dir: str = "./storage"
    file_ttl_hours: int = 24
    max_upload_mb: int = 100
    daily_job_limit: int = 30
    openai_api_key: str | None = None
    openai_transcribe_model: str = "whisper-1"
    openai_copy_model: str = "gpt-4o"
    rapidapi_key: str | None = None
    video_parse_provider: str = "rapidapi"
    commercial_convert_enabled: bool = False
    commercial_convert_api_url: str | None = None
    commercial_convert_api_key: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def storage_path(self) -> Path:
        path = Path(self.storage_dir).resolve()
        path.mkdir(parents=True, exist_ok=True)
        (path / "uploads").mkdir(parents=True, exist_ok=True)
        (path / "outputs").mkdir(parents=True, exist_ok=True)
        return path


settings = Settings()
