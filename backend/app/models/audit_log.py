"""AuditLog ORM model — immutable record of every operation for compliance."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, DateTime, Text

from app.database import Base


def _audit_id() -> str:
    return f"audit_{uuid.uuid4().hex[:12]}"


class AuditLog(Base):
    """Immutable audit trail entry. Never updated, only inserted."""

    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=_audit_id)
    event_type = Column(String(50), nullable=False, index=True)
    # event_type values: "quote_requested", "simulation_run", "transaction_completed"

    actor = Column(String(100), default="anonymous")
    # In production: user ID or API key hash

    amount_usd = Column(Float, nullable=True)
    destination_country = Column(String(2), nullable=True)
    speed_preference = Column(String(20), nullable=True)

    path_id = Column(String(64), nullable=True)
    path_summary = Column(String(255), nullable=True)

    simulation_id = Column(String(64), nullable=True)
    transaction_id = Column(String(64), nullable=True)

    detail_json = Column(Text, nullable=True)
    # Full structured context (fees, risk scores, etc.)

    client_ip = Column(String(45), nullable=True)
    # For compliance: log the request origin

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


def log_event(
    db,
    *,
    event_type: str,
    amount_usd: float | None = None,
    destination_country: str | None = None,
    speed_preference: str | None = None,
    path_id: str | None = None,
    path_summary: str | None = None,
    simulation_id: str | None = None,
    transaction_id: str | None = None,
    detail_json: str | None = None,
    client_ip: str | None = None,
    actor: str = "anonymous",
):
    """Create an immutable audit log entry. Fire-and-forget — never blocks the response."""
    try:
        entry = AuditLog(
            event_type=event_type,
            actor=actor,
            amount_usd=amount_usd,
            destination_country=destination_country,
            speed_preference=speed_preference,
            path_id=path_id,
            path_summary=path_summary,
            simulation_id=simulation_id,
            transaction_id=transaction_id,
            detail_json=detail_json,
            client_ip=client_ip,
        )
        db.add(entry)
        db.commit()
    except Exception:
        # Audit logging must never crash the main flow
        db.rollback()
