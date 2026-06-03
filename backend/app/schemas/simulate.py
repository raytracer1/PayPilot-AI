"""Pydantic schemas for simulation requests and responses."""

from pydantic import BaseModel, Field


class SimulateRequest(BaseModel):
    path_id: str = Field(..., description="ID of the selected path to simulate")
    amount_usd: float = Field(gt=0, description="Original USD amount")
    skip_on_ramp: bool = Field(False, description="USDC mode: skip on-ramp steps, transfer directly from wallet")


class SimulationStep(BaseModel):
    step_number: int
    phase: str
    name: str
    status: str
    timestamp_offset_minutes: int
    duration_minutes: int
    details: dict


class SimulationSummary(BaseModel):
    total_fee_usd: float
    total_time_minutes: int
    final_amount_local: float
    local_currency: str
    usd_equivalent_received: float
    effective_exchange_rate: float
    value_loss_pct: float


class SimulateResponse(BaseModel):
    simulation_id: str
    transaction_id: str
    status: str
    path_snapshot: dict
    steps: list[SimulationStep]
    summary: SimulationSummary
