"""User ORM model — account for authentication and payment tiers."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, DateTime, Float
from passlib.context import CryptContext

from app.database import Base

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _user_id() -> str:
    return f"usr_{uuid.uuid4().hex[:12]}"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_user_id)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    tier = Column(String(20), default="free")  # free | pro | enterprise
    balance_usd = Column(Float, default=0.0)  # Simulated account balance in USD
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    @classmethod
    def hash_password(cls, password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(self, password: str) -> bool:
        return pwd_context.verify(password, self.hashed_password)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "display_name": self.display_name,
            "is_active": self.is_active,
            "tier": self.tier,
            "balance_usd": self.balance_usd or 0.0,
            "created_at": self.created_at.isoformat() if self.created_at else "",
        }
