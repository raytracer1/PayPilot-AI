"""Pydantic schemas for transaction history."""

from datetime import datetime
from pydantic import BaseModel


class TransactionRecord(BaseModel):
    id: str
    amount_usd: float
    destination_country: str
    speed_preference: str
    total_fee_usd: float
    total_time_minutes: float
    received_local: float
    local_currency: str
    selected_path_summary: str | None = None
    created_at: str

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    transactions: list[TransactionRecord]
    total: int
