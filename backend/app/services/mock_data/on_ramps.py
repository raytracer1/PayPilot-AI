"""Mock on-ramp provider data (USD → USDC)."""

import random

from app.config import settings

ON_RAMP_PROVIDERS: dict[str, dict] = {
    "coinbase": {
        "id": "coinbase",
        "name": "Coinbase",
        "method": "ACH Transfer",
        "base_fee_usd": 2.50,
        "spread_pct": 0.10,
        "base_time_minutes": 10,
        "rating": 4.8,
        "max_amount": 25000,
        "supported_countries": ["US"],
    },
    "binance": {
        "id": "binance",
        "name": "Binance",
        "method": "Wire Transfer",
        "base_fee_usd": 1.00,
        "spread_pct": 0.30,
        "base_time_minutes": 15,
        "rating": 4.5,
        "max_amount": 50000,
        "supported_countries": ["US"],
    },
    "moonpay": {
        "id": "moonpay",
        "name": "MoonPay",
        "method": "Debit Card",
        "base_fee_usd": 3.50,
        "spread_pct": 0.50,
        "base_time_minutes": 5,
        "rating": 4.2,
        "max_amount": 10000,
        "supported_countries": ["US"],
    },
    "transak": {
        "id": "transak",
        "name": "Transak",
        "method": "Credit/Debit Card",
        "base_fee_usd": 2.00,
        "spread_pct": 0.40,
        "base_time_minutes": 8,
        "rating": 4.0,
        "max_amount": 15000,
        "supported_countries": ["US"],
    },
}


def _jitter(value: float, pct: float = 0.02) -> float:
    """Apply small Gaussian jitter if enabled."""
    if not settings.mock_jitter_enabled:
        return value
    return max(0, value * (1.0 + random.gauss(0, pct)))


def get_on_ramp_quote(provider_id: str, amount_usd: float) -> dict | None:
    """Return an on-ramp quote for the given provider and amount."""
    provider = ON_RAMP_PROVIDERS.get(provider_id)
    if not provider:
        return None
    if amount_usd > provider["max_amount"]:
        return None

    fee_usd = round(_jitter(provider["base_fee_usd"]), 2)
    spread_pct = round(_jitter(provider["spread_pct"], 0.05), 2)
    spread_usd = round(amount_usd * spread_pct / 100, 2)
    time_minutes = max(1, round(_jitter(provider["base_time_minutes"], 0.05)))

    usdc_received = round(amount_usd - fee_usd - spread_usd, 2)

    return {
        "provider": provider["name"],
        "provider_id": provider_id,
        "method": provider["method"],
        "fee_usd": fee_usd,
        "spread_pct": spread_pct,
        "spread_usd": spread_usd,
        "time_minutes": time_minutes,
        "rating": provider["rating"],
        "usdc_received": usdc_received,
    }
