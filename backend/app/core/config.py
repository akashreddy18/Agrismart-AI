import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgriSmart AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "c3VwZXJzZWNyZXRrZXlmb3JhZ3Jpc21hcnRhaXByb2R1Y3Rpb25xdWFsaXR5"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 11520
    DATABASE_URL: str = "postgresql+asyncpg://agrismart_user:agrismart_password@localhost:5432/agrismart_db"
    REDIS_URL: str = "redis://localhost:6379/0"
    GEMINI_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=[".env", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")],
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
