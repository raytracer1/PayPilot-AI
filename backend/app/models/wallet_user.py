"""WalletUser ORM model — identified by blockchain wallet address.

Non-custodial: the platform never stores private keys or holds funds.
Authentication via SIWE (Sign-In with Ethereum) signature verification.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, DateTime

from app.database import Base


def _user_id() -> str:
    return f"wal_{uuid.uuid4().hex[:12]}"


class WalletUser(Base):
    __tablename__ = "wallet_users"

    id = Column(String, primary_key=True, default=_user_id)
    wallet_address = Column(String(42), unique=True, nullable=False, index=True)
    # Normalized to checksummed address (EIP-55)

    # SIWE session management
    siwe_nonce = Column(String(64), nullable=True)
    # Random nonce generated per SIWE request, cleared after verification

    is_active = Column(Boolean, default=True)
    tier = Column(String(20), default="free")  # free | pro | enterprise

    # Optional ENS or Lens profile
    display_name = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_login_at = Column(DateTime, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "wallet_address": self.wallet_address,
            "display_name": self.display_name,
            "is_active": self.is_active,
            "tier": self.tier,
            "created_at": self.created_at.isoformat() if self.created_at else "",
        }
