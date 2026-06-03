"""Auth endpoints: register, login, me — with database-backed password verification."""

import hashlib
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

JWT_SECRET = os.environ.get("PAYPILOT_JWT_SECRET", "paypilot-dev-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24

security = HTTPBearer(auto_error=False)


def _derive_smart_wallet(user_id: str) -> str:
    """Derive deterministic 0x address from user ID."""
    h = hashlib.sha256(f"paypilot:{user_id}".encode()).hexdigest()
    return f"0x{h[:40]}"


def _create_token(user: User) -> str:
    payload = {
        "sub": user.id,
        "email": user.email,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _get_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User | None:
    """Extract user from Bearer token. Returns None if no/malformed token."""
    if credentials is None:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return db.query(User).filter(User.id == payload["sub"]).first()
    except jwt.InvalidTokenError:
        return None


@router.post("/register", status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Create account. Returns JWT token."""
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(409, "Email already registered")

    user = User(
        email=req.email,
        hashed_password=User.hash_password(req.password),
        display_name=req.display_name or req.email.split("@")[0],
    )
    db.add(user)
    db.flush()  # get user.id
    user.smart_wallet = _derive_smart_wallet(user.id)
    db.commit()
    db.refresh(user)

    return AuthResponse(token=_create_token(user), user=user.to_dict())


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Verify credentials and return JWT."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not user.verify_password(req.password):
        raise HTTPException(401, "Invalid email or password")
    return AuthResponse(token=_create_token(user), user=user.to_dict())


@router.get("/me")
def me(user: User | None = Depends(_get_user)):
    """Return current user profile."""
    if not user:
        raise HTTPException(401, "Authentication required")
    return {"user": user.to_dict()}
