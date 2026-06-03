"""POST /api/quote — compute optimal routing paths."""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.quote import Quote
from app.models.audit_log import log_event
from app.models.wallet_user import WalletUser
from app.auth import get_wallet_user
from app.schemas.quote import QuoteRequest, QuoteResponse, QuoteMeta
from app.services import path_analyzer, routing_engine
from app.utils.constants import SUPPORTED_COUNTRIES

router = APIRouter(prefix="/api", tags=["quotes"])


@router.post("/quote", response_model=QuoteResponse)
def get_quote(
    request: QuoteRequest,
    db: Session = Depends(get_db),
    req: Request = None,
    current_user: WalletUser | None = Depends(get_wallet_user),
):
    """Analyze all possible routing paths and return the top 5 ranked by AI scoring."""
    client_ip = req.client.host if req else None

    # Validate country
    if request.destination_country not in SUPPORTED_COUNTRIES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported destination country: {request.destination_country}. "
            f"Supported: {', '.join(SUPPORTED_COUNTRIES)}",
        )

    # Generate all path combinations
    raw_paths = path_analyzer.analyze(
        amount_usd=request.amount_usd,
        country=request.destination_country,
    )

    if not raw_paths:
        raise HTTPException(
            status_code=404,
            detail="No viable routing paths found for this destination and amount.",
        )

    # AI ranking
    ranked = routing_engine.rank_paths(
        raw_paths=raw_paths,
        speed_preference=request.speed_preference,
        amount_usd=request.amount_usd,
        country=request.destination_country,
    )

    if not ranked:
        raise HTTPException(
            status_code=404,
            detail=f"No paths meet the '{request.speed_preference}' speed criteria. "
            "Try a different preference.",
        )

    # Persist quote
    quote = Quote(
        amount_usd=request.amount_usd,
        destination_country=request.destination_country,
        speed_preference=request.speed_preference,
        sender_wallet=request.wallet_address,
        bank_account=request.bank_account,
        paths_json=json.dumps(ranked),
    )
    db.add(quote)
    db.commit()

    # Audit log (fire-and-forget)
    top_path = ranked[0]
    log_event(
        db,
        event_type="quote_requested",
        actor=current_user.wallet_address if current_user else "anonymous",
        amount_usd=request.amount_usd,
        destination_country=request.destination_country,
        speed_preference=request.speed_preference,
        path_id=top_path["id"],
        path_summary=(
            f"{top_path['on_ramp']['provider']} → "
            f"{top_path['network']['name']} → "
            f"{top_path['off_ramp']['provider']}"
        ),
        detail_json=json.dumps({
            "paths_returned": len(ranked),
            "paths_evaluated": len(raw_paths),
            "top_score": top_path["total_score"],
            "top_fee_usd": top_path["summary"]["total_fee_usd"],
        }),
        client_ip=client_ip,
    )

    return QuoteResponse(
        paths=ranked,
        meta=QuoteMeta(
            total_paths_evaluated=len(raw_paths),
            paths_returned=len(ranked),
            timestamp=datetime.now(timezone.utc).isoformat(),
        ),
    )
