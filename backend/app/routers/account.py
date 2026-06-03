"""Account management: deposit, balance, deposit history."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.deposit import Deposit
from app.auth import require_user
from app.schemas.account import (
    DepositRequest,
    DepositResponse,
    BalanceResponse,
    DepositHistoryResponse,
)

router = APIRouter(prefix="/api/account", tags=["account"])

# Simulated deposit processing — methods and their mock details
DEPOSIT_METHODS = {
    "ach": {"label": "ACH Bank Transfer", "time": "1-3 business days", "fee": 0.0},
    "debit_card": {"label": "Debit/Credit Card", "time": "Instant", "fee_pct": 2.9},
    "wire": {"label": "Wire Transfer", "time": "Same day", "fee": 15.0},
    "crypto": {"label": "Crypto (USDC)", "time": "~5 min", "fee": 0.5},
}


@router.post("/deposit", response_model=DepositResponse)
def deposit(
    req: DepositRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
):
    """Simulate depositing funds into the user's account.

    In production, this would integrate with Stripe/Plaid/Circle for
    actual fund movement. Here we simulate the result instantly.
    """
    method_info = DEPOSIT_METHODS.get(req.method)
    if not method_info:
        raise HTTPException(status_code=400, detail=f"Unknown method: {req.method}")

    # Calculate fee (simulated)
    fee = 0.0
    if "fee_pct" in method_info:
        fee = round(req.amount_usd * method_info["fee_pct"] / 100, 2)
    elif method_info.get("fee", 0) > 0:
        fee = method_info["fee"]

    net_amount = round(req.amount_usd - fee, 2)

    # Generate mock tx reference
    tx_ref = f"PP-{uuid.uuid4().hex[:8].upper()}"

    # Create deposit record
    dep = Deposit(
        user_id=user.id,
        amount_usd=net_amount,
        method=req.method,
        status="completed",
        tx_reference=tx_ref,
    )
    db.add(dep)

    # Update user balance
    user.balance_usd = round((user.balance_usd or 0.0) + net_amount, 2)
    db.commit()
    db.refresh(dep)

    return DepositResponse(
        id=dep.id,
        amount_usd=net_amount,
        method=req.method,
        status="completed",
        tx_reference=tx_ref,
        new_balance=user.balance_usd,
        created_at=dep.created_at.isoformat() if dep.created_at else "",
    )


@router.get("/balance")
def get_balance(
    user: User = Depends(require_user),
):
    """Return current account balance."""
    return BalanceResponse(
        balance_usd=user.balance_usd or 0.0,
        tier=user.tier,
    )


@router.get("/deposits", response_model=DepositHistoryResponse)
def get_deposits(
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
):
    """Return deposit history for the current user."""
    deposits = (
        db.query(Deposit)
        .filter(Deposit.user_id == user.id)
        .order_by(Deposit.created_at.desc())
        .limit(50)
        .all()
    )

    # Get current balance
    db.refresh(user)

    return DepositHistoryResponse(
        deposits=[
            DepositResponse(
                id=d.id,
                amount_usd=d.amount_usd,
                method=d.method,
                status=d.status,
                tx_reference=d.tx_reference,
                new_balance=user.balance_usd,  # current balance snapshot
                created_at=d.created_at.isoformat() if d.created_at else "",
            )
            for d in deposits
        ],
        total=len(deposits),
    )