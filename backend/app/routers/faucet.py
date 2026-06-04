"""Faucet endpoint — guides user to testnet faucet."""

from fastapi import APIRouter, Depends
from app.routers.auth import _get_user

router = APIRouter(prefix="/api/faucet", tags=["faucet"])


@router.post("/fund")
def fund_wallet(
    token: str = "USDC",
    amount: float = 500,
    current_user=Depends(_get_user),
):
    """Return faucet link. User gets testnet tokens directly — no backend transfer."""
    wallet = current_user.smart_wallet if current_user else "0xunknown"
    return {
        "status": "success",
        "token": token,
        "amount": amount,
        "wallet": wallet,
        "network": "Base Sepolia",
        "faucet_url": "https://faucet.circle.com",
        "message": f"Get {token} from Circle Faucet. Then sign to send.",
    }
