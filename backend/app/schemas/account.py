"""Pydantic schemas for account operations."""

from pydantic import BaseModel, Field


class DepositRequest(BaseModel):
    amount_usd: float = Field(gt=0, le=50000, description="Amount in USD to deposit")
    method: str = Field(
        default="ach",
        pattern="^(ach|debit_card|wire|crypto)$",
        description="Payment method for the deposit",
    )


class DepositResponse(BaseModel):
    id: str
    amount_usd: float
    method: str
    status: str
    tx_reference: str | None = None
    new_balance: float
    created_at: str


class BalanceResponse(BaseModel):
    balance_usd: float
    tier: str
    currency: str = "USD"


class DepositHistoryResponse(BaseModel):
    deposits: list[DepositResponse]
    total: int
