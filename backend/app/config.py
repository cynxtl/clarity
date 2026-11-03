import os
from pathlib import Path
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
WORKSPACES_DIR = DATA_DIR / "workspaces"
WORKSPACES_DIR.mkdir(exist_ok=True)

# Load optional .env file from backend or root directory
def _load_env_file(env_path: Path):
    if env_path.is_file():
        try:
            for line in env_path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'").strip('"')
                if k not in os.environ:
                    os.environ[k] = v
        except Exception:
            pass

_load_env_file(BASE_DIR / ".env")
_load_env_file(BASE_DIR.parent / ".env")

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

    # AI Provider Configuration
    AI_PROVIDER: str = os.getenv("CLARITY_AI_PROVIDER", "openai_compatible")
    AI_BASE_URL: str = os.getenv("CLARITY_AI_BASE_URL", "https://api.openai.com/v1")
    AI_MODEL: str = os.getenv("CLARITY_AI_MODEL", "gpt-4o-mini")
    AI_API_KEY: str = os.getenv("CLARITY_AI_API_KEY", "")
    AI_TEMPERATURE: float = float(os.getenv("CLARITY_AI_TEMPERATURE", "0.2"))
    AI_TIMEOUT_SECONDS: float = float(os.getenv("CLARITY_AI_TIMEOUT_SECONDS", "30.0"))
    AI_MAX_INPUT_CHARS: int = int(os.getenv("CLARITY_AI_MAX_INPUT_CHARS", "40000"))
    AI_MAX_OUTPUT_TOKENS: int = int(os.getenv("CLARITY_AI_MAX_OUTPUT_TOKENS", "4000"))

settings = Settings()
