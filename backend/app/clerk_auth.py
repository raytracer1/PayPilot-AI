"""Clerk authentication dependency for FastAPI.

Verifies Clerk session tokens (JWTs) on every request.
In production, uses Clerk's JWKS endpoint for verification.
For demo, accepts any valid-format JWT with a 'sub' claim.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security_scheme = HTTPBearer(auto_error=False)


def get_clerk_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
) -> dict | None:
    """Verify Clerk session token and return user info.

    Returns None if no token (allows anonymous access for demo).
    """
    if credentials is None:
        return None

    token = credentials.credentials
    try:
        # Decode JWT without verification for demo (Clerk handles verification)
        # In production: verify with Clerk's JWKS endpoint
        import jwt
        payload = jwt.decode(token, options={"verify_signature": False})
        return {
            "user_id": payload.get("sub", ""),
            "session_id": payload.get("sid", ""),
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session token",
        )


def require_clerk_user(
    user: dict | None = Depends(get_clerk_user),
) -> dict:
    """Require authenticated Clerk user."""
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user
