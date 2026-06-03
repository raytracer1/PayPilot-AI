"""POST /api/quote — compute optimal routing paths."""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.quote import Quote
from app.models.audit_log import log_event
from app.routers.auth import _get_user
from app.schemas.quote import QuoteRequest, QuoteResponse, QuoteMeta
from app.services import path_analyzer, routing_engine
from app.utils.constants import SUPPORTED_COUNTRIES

router = APIRouter(prefix="/api", tags=["quotes"])


@router.post("/quote", response_model=QuoteResponse)
def get_quote(
    request: QuoteRequest,
    db: Session = Depends(get_db),
    current_user = Depends(_get_user),
):
    """Analyze all possible routing paths and return the top 5 ranked by AI scoring."""

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

    # Analyze all paths
    paths = routing_engine.analyze_paths(
        raw_paths=raw_paths,
        amount_usd=request.amount_usd,
        country=request.destination_country,
        currency=request.currency,
        recipient_type=request.recipient_type,
    )

    if not paths:
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
        paths_json=json.dumps(paths),
    )
    db.add(quote)
    db.commit()

    # Audit log
    log_event(
        db,
        event_type="quote_requested",
        actor="anonymous",
        amount_usd=request.amount_usd,
        destination_country=request.destination_country,
        speed_preference=request.speed_preference,
        detail_json=json.dumps({
            "paths_returned": len(paths),
            "paths_evaluated": len(raw_paths),
        }),
    )

    return QuoteResponse(
        paths=paths,
        meta=QuoteMeta(
            total_paths_evaluated=len(raw_paths),
            paths_returned=len(paths),
            timestamp=datetime.now(timezone.utc).isoformat(),
        ),
    )
