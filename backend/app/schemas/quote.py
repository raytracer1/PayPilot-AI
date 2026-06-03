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
    overall: int
    level: str


class PathSummary(BaseModel):
    total_fee_usd: float
    total_time_minutes: int
    usd_received_after_fees: float
    received_local: float
    received_usd_equivalent: float
    currency: str
    risk_score: int
    risk_level: str
    risk_breakdown: RiskBreakdown
    efficiency_score: float
    speed_label: str


class PathOption(BaseModel):
    id: str
    rank: int
    total_score: float
    cost_score: float
    speed_score: float
    risk_score_0_100: float
    reliability_score: float
    on_ramp: OnRampSchema
    network: NetworkSchema
    off_ramp: OffRampSchema
    summary: PathSummary


class QuoteMeta(BaseModel):
    total_paths_evaluated: int
    paths_returned: int
    base_currency: str = "USD"
    timestamp: str


class QuoteResponse(BaseModel):
    paths: list[PathOption]
    meta: QuoteMeta
