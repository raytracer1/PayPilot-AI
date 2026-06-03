"""Mock L2 network data (USDC transfer layer)."""

import random

from app.config import settings

L2_NETWORKS: dict[str, dict] = {
    "base": {
        "id": "base",
        "name": "Base",
        "layer": "L2",
        "base_gas_fee_usd": 0.05,
        "base_time_minutes": 2,
        "reliability_pct": 99.9,
        "tps": 2000,
    },
    "polygon": {
        "id": "polygon",
        "name": "Polygon",
        "layer": "L2",
        "base_gas_fee_usd": 0.02,
        "base_time_minutes": 3,
        "reliability_pct": 99.8,
        "tps": 7000,
    },
    "solana": {
        "id": "solana",
        "name": "Solana",
        "layer": "L1",
        "base_gas_fee_usd": 0.01,
        "base_time_minutes": 1,
        "reliability_pct": 99.5,
        "tps": 65000,
    },
}


def get_network_quote(network_id: str) -> dict | None:
    """Return network transfer info for the given L2."""
    net = L2_NETWORKS.get(network_id)
    if not net:
        return None

    if settings.mock_jitter_enabled:
        gas_mult = 0.8 + random.random() * 0.4  # 0.8–1.2×
        gas_fee = round(net["base_gas_fee_usd"] * gas_mult, 4)
        time_minutes = max(1, round(net["base_time_minutes"] * (0.8 + random.random() * 0.4)))
    else:
        gas_fee = net["base_gas_fee_usd"]
        time_minutes = net["base_time_minutes"]

    return {
        "name": net["name"],
        "network_id": network_id,
        "layer": net["layer"],
        "gas_fee_usd": gas_fee,
        "time_minutes": time_minutes,
        "reliability_pct": net["reliability_pct"],
        "tps": net["tps"],
    }
