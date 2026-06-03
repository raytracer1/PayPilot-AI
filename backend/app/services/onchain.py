"""On-chain data service — reads USDC balances and transfer events.

Non-custodial: the platform queries blockchain state but never signs transactions.
For demo: returns simulated on-chain data when RPC is unavailable.
"""

import json
import urllib.request
from app.config import settings

# USDC contract addresses by chain
USDC_ADDRESSES = {
    "base": settings.usdc_contract_base,
    "polygon": settings.usdc_contract_polygon,
    "arbitrum": settings.usdc_contract_arbitrum,
    "8453": settings.usdc_contract_base,     # Base chain ID
    "137": settings.usdc_contract_polygon,    # Polygon chain ID
    "42161": settings.usdc_contract_arbitrum,  # Arbitrum chain ID
}

# Mainnet chain IDs
CHAIN_NAMES = {
    "8453": "Base",
    "137": "Polygon",
    "42161": "Arbitrum",
    "1": "Ethereum",
}

# Minimal ERC-20 ABI for balanceOf
BALANCEOF_SIGNATURE = "0x70a08231"  # keccak256("balanceOf(address)")


def _encode_balanceof_call(wallet_address: str) -> str:
    """Encode an eth_call for balanceOf(wallet_address)."""
    addr = wallet_address.lower().replace("0x", "").rjust(64, "0")
    return BALANCEOF_SIGNATURE + addr


def get_usdc_balance(wallet_address: str, chain_id: str = "8453") -> dict:
    """Fetch USDC balance for a wallet address on the given chain.

    Returns:
        {"balance": float, "chain": str, "wallet": str, "simulated": bool}
    """
    contract = USDC_ADDRESSES.get(chain_id, settings.usdc_contract_base)
    data = _encode_balanceof_call(wallet_address)

    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "eth_call",
        "params": [
            {"to": contract, "data": data},
            "latest",
        ],
    }

    try:
        req = urllib.request.Request(
            settings.rpc_url,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            result = json.loads(resp.read())
            if "result" in result:
                raw_balance = int(result["result"], 16)
                balance = raw_balance / 1e6  # USDC has 6 decimals
                return {
                    "balance": round(balance, 2),
                    "chain": CHAIN_NAMES.get(chain_id, chain_id),
                    "chain_id": chain_id,
                    "wallet": wallet_address,
                    "contract": contract,
                    "simulated": False,
                }
    except Exception:
        pass

    # Fallback: return simulated balance for demo
    return {
        "balance": 2500.00,  # Mock balance for demo
        "chain": CHAIN_NAMES.get(chain_id, chain_id),
        "chain_id": chain_id,
        "wallet": wallet_address,
        "contract": contract,
        "simulated": True,
    }


def get_recent_transfers(wallet_address: str, limit: int = 10) -> list[dict]:
    """Return recent USDC transfer events for the wallet.

    In production, this queries a blockchain indexer (The Graph, Etherscan API).
    For demo, returns simulated transfers.
    """
    # Simulated transfer history for demo
    import uuid
    return [
        {
            "tx_hash": f"0x{uuid.uuid4().hex[:16]}",
            "from": "0xOnRampProvider" + uuid.uuid4().hex[:4],
            "to": wallet_address,
            "amount_usdc": 500.00,
            "chain": "Base",
            "timestamp": "2026-06-03T10:00:00Z",
            "type": "on_ramp",
        },
        {
            "tx_hash": f"0x{uuid.uuid4().hex[:16]}",
            "from": wallet_address,
            "to": "0xOffRampExchange" + uuid.uuid4().hex[:4],
            "amount_usdc": 200.00,
            "chain": "Base",
            "timestamp": "2026-06-02T14:30:00Z",
            "type": "transfer",
        },
    ]
