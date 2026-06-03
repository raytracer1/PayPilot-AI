"""POST /api/simulate — run simulated transaction.

Privacy-preserving: only path_id and amount are processed.
No personal data (IP, email, wallet) is stored.
"""

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.quote import Quote
from app.models.transaction import Transaction
from app.schemas.simulate import SimulateRequest, SimulateResponse
from app.services.simulator import simulate as run_simulation

router = APIRouter(prefix="/api", tags=["simulate"])


@router.post("/simulate", response_model=SimulateResponse)
def simulate(
    request: SimulateRequest,
    db: Session = Depends(get_db),
):
    """Generate simulated transaction steps from a route path."""
    if not request.path_id.startswith("path_"):
        raise HTTPException(status_code=400, detail="Invalid path_id format")

    # Look up path from recent quotes (stateless, no user tracking)
    recent_quote = (
        db.query(Quote)
        .order_by(Quote.created_at.desc())
        .first()
    )

    path_data = None
    if recent_quote:
        paths = json.loads(recent_quote.paths_json)
        for p in paths:
            if p["id"] == request.path_id:
                path_data = p
                break

    if path_data is None:
        raise HTTPException(
            status_code=404,
            detail="Path not found. Request a quote first.",
        )

    result = run_simulation(path=path_data, amount_usdc=request.amount_usd)

    # Minimal operational record — no personal identifiers
    tx = Transaction(
        id=result["transaction_id"],
        path_id=request.path_id,
        path_summary=(
            f"{path_data['network']['name']} → "
            f"{path_data['off_ramp']['provider']}"
        ),
        amount_usd=request.amount_usd,
        destination_country=recent_quote.destination_country,
        speed_preference=recent_quote.speed_preference,
        total_fee_usd=result["summary"]["total_fee_usd"],
        total_time_minutes=result["summary"]["total_time_minutes"],
        received_local=result["summary"]["final_amount_local"],
        local_currency=result["summary"]["local_currency"],
        steps_json=json.dumps(result["steps"]),
    )
    db.add(tx)
    db.commit()

    return SimulateResponse(**result)
