"""Wallet Abstraction Layer — unified interface for Smart Wallet and BYO Wallet.

Provides identical interface regardless of wallet type:
  - Smart Wallet: auto-created on Clerk sign-up, simulated for demo
  - BYO Wallet: user-connected MetaMask/Coinbase/WalletConnect
"""

import hashlib
from app.services.onchain import get_usdc_balance


def get_smart_wallet(clerk_user_id: str) -> dict:
    """Generate a deterministic smart wallet from Clerk user ID.

    In production: integrates with Biconomy, ZeroDev, or Stackup for
    actual ERC-4337 smart wallet creation with gas sponsorship.
    For demo: derives a deterministic address from the user ID.
    """
    # Derive deterministic address from Clerk user ID
    addr_hash = hashlib.sha256(f"paypilot-smart:{clerk_user_id}".encode()).hexdigest()
    wallet_address = f"0x{addr_hash[:40]}"

    return {
        "wallet_address": wallet_address,
        "wallet_type": "smart",
        "chain": "base",
        "chain_id": "8453",
        "balances": {
            "USDC": 2500.00,  # Simulated starting balance
        },
        "features": {
            "gas_sponsored": True,
            "recovery_enabled": True,
            "one_click_payments": True,
        },
        "created_via": "clerk",
        "user_id": clerk_user_id,
    }


def get_byo_wallet(wallet_address: str, chain_id: str = "8453") -> dict:
    """Wrap a BYO (Bring Your Own) wallet with unified interface.

    Reads on-chain USDC balance via RPC.
    """
    balance_data = get_usdc_balance(wallet_address, chain_id)

    return {
        "wallet_address": wallet_address,
        "wallet_type": "byo",
        "chain": balance_data.get("chain", "Base"),
        "chain_id": chain_id,
        "balances": {
            "USDC": balance_data.get("balance", 0.0),
        },
        "features": {
            "gas_sponsored": False,
            "recovery_enabled": False,
            "one_click_payments": False,
        },
        "created_via": "wagmi",
        "user_id": None,
        "simulated_balance": balance_data.get("simulated", False),
    }


def get_unified_wallet(
    clerk_user_id: str | None = None,
    wallet_address: str | None = None,
    chain_id: str = "8453",
) -> dict | None:
    """Return a unified wallet object from either source.

    Priority: BYO wallet if connected, else Smart Wallet if Clerk user exists.
    Returns None if neither is available.
    """
    if wallet_address:
        return get_byo_wallet(wallet_address, chain_id)

    if clerk_user_id:
        return get_smart_wallet(clerk_user_id)

    return None
