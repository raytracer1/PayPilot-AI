"""Auth endpoints: register, login, me — self-custody key generation.

On registration:
- Generates a real Ethereum secp256k1 keypair
- Stores ONLY the wallet address in DB (never the private key)
- Returns the private key ONCE to the user to save
"""

import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from coincurve import PrivateKey
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse, RegisterResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

JWT_SECRET = os.environ.get("PAYPILOT_JWT_SECRET", "paypilot-dev-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24

security = HTTPBearer(auto_error=False)


def _generate_keypair() -> tuple[str, str]:
    """Generate a real Ethereum keypair using secp256k1.
    Returns (private_key_hex, wallet_address).
    The private key is NEVER stored — only returned once.
    """
    priv_bytes = secrets.token_bytes(32)
    pk = PrivateKey(priv_bytes)
    # Uncompressed public key: 0x04 || x (32 bytes) || y (32 bytes)
    pub_bytes = pk.public_key.format(compressed=False)[1:]  # strip 0x04 prefix
    # Ethereum address: keccak256(pubkey)[-20:]
    addr = "0x" + hashlib.sha3_256(pub_bytes).digest()[-20:].hex()
    return "0x" + priv_bytes.hex(), addr


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
    """Create account with a real Ethereum keypair.

    ⚠️ The private_key is returned ONCE here and NEVER stored in the database.
    The user MUST save it themselves. It cannot be recovered if lost.
    """
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(409, "Email already registered")

    # Generate real keypair — private key never stored
    private_key, wallet_address = _generate_keypair()

    user = User(
        email=req.email,
        hashed_password=User.hash_password(req.password),
        display_name=req.display_name or req.email.split("@")[0],
        smart_wallet=wallet_address,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return RegisterResponse(
        token=_create_token(user),
        user=user.to_dict(),
        private_key=private_key,
    )


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Verify credentials and return JWT. Private key is NOT returned on login."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not user.verify_password(req.password):
        raise HTTPException(401, "Invalid email or password")
    return AuthResponse(token=_create_token(user), user=user.to_dict())


@router.get("/me")
def me(user: User | None = Depends(_get_user)):
    """Return current user profile (no private key)."""
    if not user:
        raise HTTPException(401, "Authentication required")
    return {"user": user.to_dict()}
