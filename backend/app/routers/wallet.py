"""Wallet router — read-only on-chain balance and transfer history.

Non-custodial: the platform reads blockchain state but never holds funds.
"""

from fastapi import APIRouter, Depends, Query

from app.models.wallet_user import WalletUser
from app.auth import require_wallet
from app.services.onchain import get_usdc_balance, get_recent_transfers

router = APIRouter(prefix="/api/wallet", tags=["wallet"])


@router.get("/balance")
def wallet_balance(
    chain_id: str = Query("8453", description="Chain ID (8453=Base, 137=Polygon, 42161=Arbitrum)"),
    user: WalletUser = Depends(require_wallet),
):
    """Return the USDC balance for the connected wallet on the specified chain.

    Balance is fetched on-chain via RPC. Falls back to simulated data for demo.
    """
    result = get_usdc_balance(user.wallet_address, chain_id)
    return result


@router.get("/transactions")
def wallet_transactions(
    limit: int = Query(10, le=50),
    user: WalletUser = Depends(require_wallet),
):
    """Return recent USDC transfer events for the connected wallet."""
    transfers = get_recent_transfers(user.wallet_address, limit)
    return {
        "transfers": transfers,
        "total": len(transfers),
        "wallet": user.wallet_address,
    }


@router.get("/links")
def onramp_links():
    """Return external on-ramp provider links for buying USDC directly."""
    return {
        "providers": [
            {
                "name": "MoonPay",
                "url": "https://buy.moonpay.com",
                "description": "Buy USDC with credit/debit card or bank transfer. Sent directly to your wallet.",
                "networks": ["Base", "Polygon", "Arbitrum"],
            },
            {
                "name": "Transak",
                "url": "https://transak.com",
                "description": "On-ramp aggregator. Supports 100+ countries.",
                "networks": ["Base", "Polygon"],
            },
            {
                "name": "Coinbase Onramp",
                "url": "https://pay.coinbase.com",
                "description": "Buy USDC directly from Coinbase into your wallet.",
                "networks": ["Base"],
            },
        ],
        "disclaimer": "These are third-party services. PayPilot never touches your funds.",
    }
