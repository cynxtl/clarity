import os
from pathlib import Path
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
WORKSPACES_DIR = DATA_DIR / "workspaces"
WORKSPACES_DIR.mkdir(exist_ok=True)

class Settings(BaseModel):
    PROJECT_NAME: str = "Clarity Documentation Engine"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'clarity.db'}")
    DATA_DIR: Path = DATA_DIR
    WORKSPACES_DIR: Path = WORKSPACES_DIR
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    # Upload limits
    MAX_UPLOAD_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB max ZIP upload
    MAX_EXTRACTED_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB total extracted
    MAX_SINGLE_FILE_BYTES: int = 5 * 1024 * 1024  # 5 MB per file
    MAX_FILE_COUNT: int = 600

settings = Settings()
