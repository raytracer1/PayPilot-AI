"""JWT authentication utilities and FastAPI dependency — v4 wallet-based.

Authentication via SIWE (Sign-In with Ethereum): wallet signs a message,
the server verifies it and issues a JWT session token.
"""

from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.wallet_user import WalletUser

SECRET_KEY = settings.jwt_secret
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

security_scheme = HTTPBearer(auto_error=False)


def create_access_token(user_id: str, identifier: str) -> str:
    """Create a JWT access token for the given wallet user."""
    payload = {
        "sub": user_id,
        "wallet": identifier,  # wallet address as the user identifier
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Decode and validate a JWT token. Returns payload or None."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_wallet_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> WalletUser | None:
    """FastAPI dependency: extract and validate wallet user from Bearer token.

    Returns None if no token provided (allows unauthenticated access for demo).
    Raises 401 if token is invalid.
    """
    if credentials is None:
        return None

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = db.query(WalletUser).filter(WalletUser.id == payload["sub"]).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wallet user not found or inactive",
        )

    return user


def require_wallet(
    user: WalletUser | None = Depends(get_wallet_user),
) -> WalletUser:
    """FastAPI dependency: require authenticated wallet. Raises 401 if not logged in."""
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required — please connect your wallet",
        )
    return user
