"""Transaction ORM model — persisted after each simulation."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, DateTime, Text

from app.database import Base


def _tx_id() -> str:
    return f"tx_{uuid.uuid4().hex[:12]}"


def _sim_id() -> str:
    return f"sim_{uuid.uuid4().hex[:12]}"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=_tx_id)
    amount_usd = Column(Float, nullable=False)
    destination_country = Column(String(2), nullable=False)
    speed_preference = Column(String(20), nullable=False)
    sender_wallet = Column(String(255), nullable=True)
    bank_account = Column(String(255), nullable=True)
    selected_path_id = Column(String(64), nullable=False)
    simulation_id = Column(String(64), unique=True, nullable=False, default=_sim_id)
    status = Column(String(20), default="completed")
    total_fee_usd = Column(Float, nullable=False)
    total_time_minutes = Column(Float, nullable=False)
    received_local = Column(Float, nullable=False)
    local_currency = Column(String(3), nullable=False)
    selected_path_summary = Column(String(255), nullable=True)
    path_snapshot_json = Column(Text, nullable=True)
    steps_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
