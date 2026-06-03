"""POST /api/simulate — run simulated transaction."""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.transaction import Transaction
from app.models.quote import Quote
from app.models.audit_log import log_event
from app.models.wallet_user import WalletUser
from app.auth import get_wallet_user
from app.schemas.simulate import SimulateRequest, SimulateResponse
from app.services.simulator import simulate as run_simulation

router = APIRouter(prefix="/api", tags=["simulate"])


@router.post("/simulate", response_model=SimulateResponse)
def simulate(
    request: SimulateRequest,
    db: Session = Depends(get_db),
    req: Request = None,
    current_user: WalletUser | None = Depends(get_wallet_user),
):
    """Simulate a transaction along the chosen path. No real funds moved.

    SECURITY: This is a simulation-only endpoint. In production, the actual
    fund transfer would be executed via third-party APIs (Circle, Bitso, etc.)
    — this application NEVER custodies funds directly.
    """
    client_ip = req.client.host if req else None

    # Find the path from a recent quote (or accept any valid path_id)
    # For simplicity, the path_id encodes provider info
    if not request.path_id.startswith("path_"):
        raise HTTPException(status_code=400, detail="Invalid path_id format")

    # We need the full path data. Try to find from recent quotes.
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
            detail="Path not found. Please request a quote first, then simulate from results.",
        )

    # Non-custodial: the platform never holds funds.
    # In production, the user signs a transaction in their wallet which sends
    # USDC directly to the on-ramp provider. Here we simulate that flow.

    # Run simulation
    result = run_simulation(path=path_data, amount_usd=request.amount_usd)

    path_summary = (
        f"{path_data['on_ramp']['provider']} → "
        f"{path_data['network']['name']} → "
        f"{path_data['off_ramp']['provider']}"
    )

    # Persist transaction
    tx = Transaction(
        id=result["transaction_id"],
        wallet_address=current_user.wallet_address if current_user else None,
        amount_usd=request.amount_usd,
        destination_country=recent_quote.destination_country,
        speed_preference=recent_quote.speed_preference,
        selected_path_id=request.path_id,
        simulation_id=result["simulation_id"],
        status="completed",
        total_fee_usd=result["summary"]["total_fee_usd"],
        total_time_minutes=result["summary"]["total_time_minutes"],
        received_local=result["summary"]["final_amount_local"],
        local_currency=result["summary"]["local_currency"],
        selected_path_summary=path_summary,
        path_snapshot_json=json.dumps(path_data),
        steps_json=json.dumps(result["steps"]),
        completed_at=datetime.now(timezone.utc),
    )
    db.add(tx)
    db.commit()

    # Audit log
    log_event(
        db,
        event_type="simulation_run",
        actor=current_user.wallet_address if current_user else "anonymous",
        amount_usd=request.amount_usd,
        destination_country=recent_quote.destination_country,
        speed_preference=recent_quote.speed_preference,
        path_id=request.path_id,
        path_summary=path_summary,
        simulation_id=result["simulation_id"],
        transaction_id=result["transaction_id"],
        detail_json=json.dumps({
            "total_fee_usd": result["summary"]["total_fee_usd"],
            "total_time_minutes": result["summary"]["total_time_minutes"],
            "final_amount_local": result["summary"]["final_amount_local"],
            "local_currency": result["summary"]["local_currency"],
            "steps_count": len(result["steps"]),
            "mode": "SIMULATION",
        }),
        client_ip=client_ip,
    )

    return SimulateResponse(**result)
