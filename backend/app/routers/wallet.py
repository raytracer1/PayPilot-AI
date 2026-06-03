"""Wallet router — unified wallet interface via Wallet Abstraction Layer.

Supports both Smart Wallet (Clerk) and BYO Wallet (wagmi).
"""

from fastapi import APIRouter, Depends, Query

from app.clerk_auth import get_clerk_user
from app.services.wallet_abstraction import get_unified_wallet
from app.services.onchain import get_recent_transfers

router = APIRouter(prefix="/api/wallet", tags=["wallet"])


@router.get("/unified")
def unified_wallet(
    chain_id: str = Query("8453"),
    wallet_address: str = Query(None, description="BYO wallet address"),
    clerk_user: dict | None = Depends(get_clerk_user),
):
    """Return unified wallet object from either Smart Wallet or BYO Wallet."""
    result = get_unified_wallet(
        clerk_user_id=clerk_user["user_id"] if clerk_user else None,
        wallet_address=wallet_address,
        chain_id=chain_id,
    )
    if result is None:
        return {"error": "No wallet available. Sign in or connect a wallet."}
    return result


@router.get("/balance")
def wallet_balance(
    chain_id: str = Query("8453"),
    wallet_address: str = Query(None),
    clerk_user: dict | None = Depends(get_clerk_user),
):
    """Return USDC balance from either wallet type."""
    wallet = get_unified_wallet(
        clerk_user_id=clerk_user["user_id"] if clerk_user else None,
        wallet_address=wallet_address,
        chain_id=chain_id,
    )
    if wallet is None:
        return {"balance": 0, "error": "No wallet available"}
    return {
        "balance": wallet["balances"]["USDC"],
        "wallet_address": wallet["wallet_address"],
        "wallet_type": wallet["wallet_type"],
        "chain": wallet["chain"],
    }


@router.get("/transactions")
def wallet_transactions(
    limit: int = Query(10, le=50),
    wallet_address: str = Query(None),
    clerk_user: dict | None = Depends(get_clerk_user),
):
    """Return recent USDC transfers for the wallet."""
    wallet = get_unified_wallet(
        clerk_user_id=clerk_user["user_id"] if clerk_user else None,
        wallet_address=wallet_address,
    )
    if wallet is None:
        return {"transfers": [], "total": 0}

    transfers = get_recent_transfers(wallet["wallet_address"], limit)
    return {
        "transfers": transfers,
        "total": len(transfers),
        "wallet": wallet["wallet_address"],
        "wallet_type": wallet["wallet_type"],
    }


@router.get("/links")
def onramp_links():
    """Return external on-ramp provider links."""
    return {
        "providers": [
            {"name": "MoonPay", "url": "https://buy.moonpay.com", "description": "Card/bank → USDC directly to your wallet", "networks": ["Base", "Polygon", "Arbitrum"]},
            {"name": "Transak", "url": "https://transak.com", "description": "Global on-ramp aggregator", "networks": ["Base", "Polygon"]},
            {"name": "Coinbase Onramp", "url": "https://pay.coinbase.com", "description": "USDC on Base from Coinbase", "networks": ["Base"]},
        ],
        "disclaimer": "Third-party services. PayPilot never touches your funds.",
    }
