"""GET /api/transactions — filtered to current user only."""

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.transaction import Transaction, hash_user
from app.routers.auth import _get_user
from app.schemas.transaction import TransactionRecord, TransactionListResponse

router = APIRouter(prefix="/api", tags=["transactions"])


@router.get("/transactions", response_model=TransactionListResponse)
def list_transactions(
    db: Session = Depends(get_db),
    current_user = Depends(_get_user),
):
    """Return past simulated transactions for the current user only."""
    user_hash = hash_user(current_user.id) if current_user else "anon"

    txs = (
        db.query(Transaction)
        .filter(Transaction.user_hash == user_hash)
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
