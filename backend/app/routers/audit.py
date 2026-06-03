"""GET /api/audit-log — compliance audit trail endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/api", tags=["audit"])


@router.get("/audit-log")
def get_audit_log(limit: int = 50, db: Session = Depends(get_db)):
    """Return the most recent audit log entries, newest first."""
    entries = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )

    return {
        "entries": [
            {
                "id": e.id,
                "event_type": e.event_type,
                "actor": e.actor,
                "amount_usd": e.amount_usd,
                "destination_country": e.destination_country,
                "speed_preference": e.speed_preference,
                "path_id": e.path_id,
                "path_summary": e.path_summary,
                "simulation_id": e.simulation_id,
                "transaction_id": e.transaction_id,
                "detail_json": e.detail_json,
                "client_ip": e.client_ip,
                "created_at": e.created_at.isoformat() if e.created_at else "",
            }
            for e in entries
        ],
        "total": len(entries),
    }
