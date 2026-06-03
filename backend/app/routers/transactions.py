"""GET /api/transactions — operational history, no personal data."""

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionRecord, TransactionListResponse

router = APIRouter(prefix="/api", tags=["transactions"])


@router.get("/transactions", response_model=TransactionListResponse)
def list_transactions(db: Session = Depends(get_db)):
    """Return past simulated transactions, newest first. No personal data."""
    txs = (
        db.query(Transaction)
        .order_by(Transaction.created_at.desc())
        .limit(50)
        .all()
    )

    records = [
        TransactionRecord(
            id=tx.id,
            amount_usd=tx.amount_usd,
            destination_country=tx.destination_country,
            speed_preference=tx.speed_preference,
            total_fee_usd=tx.total_fee_usd,
            total_time_minutes=tx.total_time_minutes,
            received_local=tx.received_local,
            local_currency=tx.local_currency,
            selected_path_summary=tx.path_summary,
            created_at=tx.created_at.isoformat() if tx.created_at else "",
        )
        for tx in txs
    ]

    return TransactionListResponse(transactions=records, total=len(records))


@router.get("/transactions/{tx_id}")
def get_transaction(tx_id: str, db: Session = Depends(get_db)):
    """Return a specific transaction with steps."""
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return {
        "id": tx.id,
        "amount_usd": tx.amount_usd,
        "destination_country": tx.destination_country,
        "speed_preference": tx.speed_preference,
        "total_fee_usd": tx.total_fee_usd,
        "total_time_minutes": tx.total_time_minutes,
        "received_local": tx.received_local,
        "local_currency": tx.local_currency,
        "selected_path_summary": tx.path_summary,
        "steps": json.loads(tx.steps_json) if tx.steps_json else [],
        "created_at": tx.created_at.isoformat() if tx.created_at else "",
    }
