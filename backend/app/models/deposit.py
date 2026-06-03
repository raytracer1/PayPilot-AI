"""Deposit ORM model — simulated fund deposits into user account."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, DateTime

from app.database import Base


def _dep_id() -> str:
    return f"dep_{uuid.uuid4().hex[:12]}"


class Deposit(Base):
    __tablename__ = "deposits"

    id = Column(String, primary_key=True, default=_dep_id)
    user_id = Column(String, nullable=False, index=True)
    amount_usd = Column(Float, nullable=False)
    method = Column(String(50), nullable=False)
    # method: "ach", "debit_card", "wire", "crypto"

    status = Column(String(20), default="completed")
    # status: "pending", "completed", "failed"

    tx_reference = Column(String(100), nullable=True)
    # Mock transaction reference for simulation

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
