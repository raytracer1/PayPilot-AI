"""Transaction ORM model — minimal operational data only."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, DateTime, Text

from app.database import Base


def _tx_id() -> str:
    return f"tx_{uuid.uuid4().hex[:12]}"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=_tx_id)

    # Operational data — no personal identifiers
    path_id = Column(String(64), nullable=False)
    path_summary = Column(String(255), nullable=True)
    amount_usd = Column(Float, nullable=False)
    destination_country = Column(String(2), nullable=False)
    speed_preference = Column(String(20), nullable=False)
    total_fee_usd = Column(Float, nullable=False)
    total_time_minutes = Column(Float, nullable=False)
    received_local = Column(Float, nullable=False)
    local_currency = Column(String(3), nullable=False)
    steps_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
