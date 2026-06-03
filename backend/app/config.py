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

    # Blockchain RPC (for on-chain balance reads)
    rpc_url: str = "https://mainnet.base.org"  # Base L2 default
    usdc_contract_base: str = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    usdc_contract_polygon: str = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
    usdc_contract_arbitrum: str = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"

    # JWT secret for SIWE session tokens
    jwt_secret: str = "paypilot-dev-secret-change-in-prod"

    # App
    app_name: str = "PayPilot AI v5"
    debug: bool = True
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = {"env_prefix": "PAYPILOT_"}


settings = Settings()
