"""POST /api/auth/register | /api/auth/login | GET /api/auth/me"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.auth import create_access_token, get_current_user, require_user
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=201)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Create a new user account."""
    # Check if email already exists
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )

    user = User(
        email=request.email,
        hashed_password=User.hash_password(request.password),
        display_name=request.display_name or request.email.split("@")[0],
        tier="free",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        user=user.to_dict(),
    )


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate and return a JWT token."""
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not user.verify_password(request.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account is deactivated.",
        )

    token = create_access_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        user=user.to_dict(),
    )


@router.get("/me")
def me(user: User = Depends(require_user)):
    """Return the current authenticated user's profile."""
    return {"user": user.to_dict()}
