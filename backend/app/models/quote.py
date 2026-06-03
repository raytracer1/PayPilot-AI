"""Quote ORM model — persisted per quote request for audit/history."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, DateTime, Text, Integer

from app.database import Base


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(String, primary_key=True, default=lambda: uuid.uuid4().hex)
    amount_usd = Column(Float, nullable=False)
    destination_country = Column(String(2), nullable=False)
    speed_preference = Column(String(20), nullable=False)
    sender_wallet = Column(String(255), nullable=True)
    bank_account = Column(String(255), nullable=True)
    paths_json = Column(Text, nullable=False)
    selected_path_index = Column(Integer, nullable=True)
    selected_path_id = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
