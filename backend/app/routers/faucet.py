"""Faucet endpoint — testnet token distribution.

In production: integrates with Circle/USDT faucet APIs (rate-limited, CAPTCHA-protected).
For demo: simulates instant token delivery on Base Sepolia.
"""

from fastapi import APIRouter, Depends
from app.routers.auth import _get_user

router = APIRouter(prefix="/api/faucet", tags=["faucet"])


@router.post("/fund")
def fund_wallet(
    token: str = "USDT",
    amount: float = 500,
    current_user=Depends(_get_user),
):
    """Fund the user's wallet with testnet tokens.

    Production: calls Circle/Sepolia faucet API with rate limiting.
    Demo: simulates instant delivery.
    """
    return {
        "status": "success",
        "token": token,
        "amount": amount,
        "wallet": current_user.smart_wallet if current_user else "0xunknown",
        "network": "Base Sepolia",
        "tx_hash": f"0xfaucet_{token.lower()}_{int(amount)}",
        "message": f"{amount} {token} sent to wallet. Ready for transfer.",
    }
