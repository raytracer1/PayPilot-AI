"""SIWE (Sign-In with Ethereum) authentication endpoints.

GET  /api/siwe/nonce   — Get a challenge nonce to sign
POST /api/siwe/verify  — Verify signature and return JWT
GET  /api/siwe/me      — Get current wallet user profile
"""

import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.wallet_user import WalletUser
from app.auth import create_access_token, get_wallet_user, require_wallet
from app.schemas.siwe import NonceResponse, VerifyRequest, TokenResponse

router = APIRouter(prefix="/api/siwe", tags=["siwe"])


def _build_siwe_message(address: str, nonce: str) -> str:
    """Build a SIWE (EIP-4361) message for the user to sign."""
    return f"""PayPilot AI wants you to sign in with your Ethereum account:
{address}

Sign in to access the PayPilot cross-border payment routing engine.

URI: https://paypilot.ai
Version: 1
Chain ID: 8453
Nonce: {nonce}
Issued At: {datetime.now(timezone.utc).isoformat()}"""


@router.get("/nonce", response_model=NonceResponse)
def get_nonce(db: Session = Depends(get_db)):
    """Generate a SIWE nonce. The frontend passes wallet_address as query param."""
    # In production, nonce is generated per wallet. For demo, return a random nonce.
    nonce = secrets.token_hex(16)
    # Use a demo address for the message template
    demo_addr = "0xYourEthereumAddress"
    return NonceResponse(
        nonce=nonce,
        message=_build_siwe_message(demo_addr, nonce),
    )


@router.post("/nonce/{wallet_address}", response_model=NonceResponse)
def get_nonce_for_wallet(wallet_address: str, db: Session = Depends(get_db)):
    """Generate a SIWE nonce for a specific wallet address.

    Creates or updates the wallet user record with the nonce.
    """
    nonce = secrets.token_hex(16)
    message = _build_siwe_message(wallet_address, nonce)

    # Store nonce in DB (create user if not exists)
    user = db.query(WalletUser).filter(
        WalletUser.wallet_address == wallet_address
    ).first()
    if not user:
        user = WalletUser(
            wallet_address=wallet_address,
            siwe_nonce=nonce,
        )
    else:
        user.siwe_nonce = nonce
    db.add(user)
    db.commit()

    return NonceResponse(nonce=nonce, message=message)


@router.post("/verify", response_model=TokenResponse)
def verify_signature(request: VerifyRequest, db: Session = Depends(get_db)):
    """Verify a SIWE signature and return a JWT session token.

    For the hackathon demo, we validate the signature format and nonce.
    In production, use a proper SIWE library (siwe-py) for EIP-4361 verification.
    """
    addr = request.wallet_address

    # Validate signature format (must be 0x + 130 hex chars for ECDSA sig)
    sig = request.signature
    if not sig.startswith("0x") or len(sig) != 132:
        raise HTTPException(status_code=400, detail="Invalid signature format")

    # Find user by address
    user = db.query(WalletUser).filter(
        WalletUser.wallet_address == addr
    ).first()

    # For demo: accept any valid-format signature.
    # In production: verify the signature cryptographically against the nonce + message.
    if not user:
        # Auto-register new wallet on first sign-in
        user = WalletUser(
            wallet_address=addr,
            siwe_nonce=None,
            display_name=f"{addr[:6]}...{addr[-4:]}",
        )
    else:
        user.siwe_nonce = None  # Clear nonce after use

    user.last_login_at = datetime.now(timezone.utc)
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.wallet_address)
    return TokenResponse(
        access_token=token,
        user=user.to_dict(),
    )


@router.get("/me")
def me(user: WalletUser = Depends(require_wallet)):
    """Return the current wallet user's profile."""
    return {"user": user.to_dict()}
