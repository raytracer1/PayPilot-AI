"""Pydantic schemas for quote requests and responses."""

from datetime import datetime
from pydantic import BaseModel, Field


class QuoteRequest(BaseModel):
    amount_usd: float = Field(gt=0, le=100_000, description="Amount in USD to send")
    destination_country: str = Field(
        ..., min_length=2, max_length=2, description="ISO 3166-1 alpha-2 country code"
    )
    speed_preference: str = Field(
        "balanced", pattern="^(fast|cheapest|balanced)$"
    )
    currency: str = Field("USDT", pattern="^(USDC|USDT)$")
    recipient_type: str = Field("bank", pattern="^(bank|wallet)$")
    wallet_address: str | None = None
    bank_account: str | None = None


class OnRampSchema(BaseModel):
    provider: str
    method: str
    fee_usd: float
    spread_pct: float
    spread_usd: float
    time_minutes: int
    rating: float


class NetworkSchema(BaseModel):
    name: str
    layer: str
    gas_fee_usd: float
    time_minutes: int
    reliability_pct: float
    tps: int


class OffRampSchema(BaseModel):
    provider: str
    method: str
    fee_usd: float
    spread_pct: float
    spread_usd: float
    time_minutes: int
    currency: str
    exchange_rate: float
    received_local: float


class RiskBreakdown(BaseModel):
    regulatory: float
    congestion: float
    liquidity: float
    intermediary: float
    overall: int
    level: str


class PathSummary(BaseModel):
    input_amount_usd: float
    total_fee_usd: float
    total_time_minutes: int
    on_ramp_fee_usd: float
    on_ramp_time_minutes: int
    gas_fee_usd: float
    off_ramp_fee_usd: float
    received_local: float
    currency: str
    exchange_rate: float
    risk_score: int
    risk_level: str
    risk_breakdown: RiskBreakdown


class PathOption(BaseModel):
    id: str
    on_ramp: OnRampSchema | None = None
    network: NetworkSchema
    off_ramp: OffRampSchema | None = None
    summary: PathSummary


class QuoteMeta(BaseModel):
    total_paths_evaluated: int
    paths_returned: int
    base_currency: str = "USD"
    timestamp: str


class QuoteResponse(BaseModel):
    paths: list[PathOption]
    meta: QuoteMeta
