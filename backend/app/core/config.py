from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Deadline Conflict Detection System"
    APP_VERSION: str = "1.0.0"

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/deadline_db"

    SECRET_KEY: str = "change-this-to-a-long-random-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ML_MODEL_PATH: str = "app/ml/models/deadline_risk_model.pkl"
    ML_MODEL_VERSION: str = "1.0.0"

    DEBUG: bool = False

    # Google Gemini (FREE) — get key at aistudio.google.com/app/apikey
    GEMINI_API_KEY: str = ""

    # Admin credentials — stored in .env only, no DB needed
    ADMIN_EMAIL: str = "admin@deadlineiq.com"
    ADMIN_PASSWORD: str = "Admin@123"
    ADMIN_SECRET_KEY: str = "admin-super-secret-change-this"

    # Email / SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_ENABLED: bool = False  # set True in .env once SMTP creds are added

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    model_config = {
        "env_file": ".env",
        "extra": "ignore",
        "protected_namespaces": (),
    }


settings = Settings()