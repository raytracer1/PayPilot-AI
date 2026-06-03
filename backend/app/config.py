"""Application configuration via Pydantic Settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """App-wide settings, overridable via environment variables."""

    # Database
    database_url: str = "sqlite+aiosqlite:///./paypilot.db"

    # Mock data
    mock_jitter_enabled: bool = True
    mock_seed: int = 42

    # LLM (optional extension point — disabled by default)
    llm_api_key: str = ""
    llm_enabled: bool = False

    # App
    app_name: str = "PayPilot AI v3"
    debug: bool = True
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = {"env_prefix": "PAYPILOT_"}


settings = Settings()
