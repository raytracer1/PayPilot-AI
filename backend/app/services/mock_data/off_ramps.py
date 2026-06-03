"""Mock off-ramp provider data (USDC → local currency)."""

import random

from app.config import settings

OFF_RAMP_PROVIDERS: dict[str, dict[str, dict]] = {
    "MX": {
        "bitso": {
            "id": "bitso",
            "name": "Bitso",
            "method": "SPEI",
            "base_fee_usd": 1.00,
            "spread_pct": 0.30,
            "base_time_minutes": 5,
            "rating": 4.6,
            "currency": "MXN",
            "base_exchange_rate": 19.50,
        },
        "binance_p2p": {
            "id": "binance_p2p",
            "name": "Binance P2P",
            "method": "P2P Transfer",
            "base_fee_usd": 0.50,
            "spread_pct": 0.50,
            "base_time_minutes": 10,
            "rating": 4.3,
            "currency": "MXN",
            "base_exchange_rate": 19.80,
        },
    },
    "BR": {
        "mercadopago": {
            "id": "mercadopago",
            "name": "Mercado Pago",
            "method": "PIX",
            "base_fee_usd": 0.80,
            "spread_pct": 0.25,
            "base_time_minutes": 8,
            "rating": 4.7,
            "currency": "BRL",
            "base_exchange_rate": 5.20,
        },
        "binance_p2p": {
            "id": "binance_p2p",
            "name": "Binance P2P",
            "method": "P2P Transfer",
            "base_fee_usd": 0.50,
            "spread_pct": 0.50,
            "base_time_minutes": 12,
            "rating": 4.3,
            "currency": "BRL",
            "base_exchange_rate": 5.25,
        },
    },
    "AR": {
        "belo": {
            "id": "belo",
            "name": "Belo",
            "method": "Bank Transfer",
            "base_fee_usd": 1.50,
            "spread_pct": 0.40,
            "base_time_minutes": 6,
            "rating": 4.4,
            "currency": "ARS",
            "base_exchange_rate": 880.0,
        },
        "binance_p2p": {
            "id": "binance_p2p",
            "name": "Binance P2P",
            "method": "P2P Transfer",
            "base_fee_usd": 0.70,
            "spread_pct": 0.60,
            "base_time_minutes": 15,
            "rating": 4.3,
            "currency": "ARS",
            "base_exchange_rate": 895.0,
        },
    },
    "CO": {
        "buenbit": {
            "id": "buenbit",
            "name": "Buenbit",
            "method": "Bank Transfer",
            "base_fee_usd": 1.20,
            "spread_pct": 0.35,
            "base_time_minutes": 7,
            "rating": 4.3,
            "currency": "COP",
            "base_exchange_rate": 3950.0,
        },
        "binance_p2p": {
            "id": "binance_p2p",
            "name": "Binance P2P",
            "method": "P2P Transfer",
            "base_fee_usd": 0.60,
            "spread_pct": 0.55,
            "base_time_minutes": 14,
            "rating": 4.3,
            "currency": "COP",
            "base_exchange_rate": 3980.0,
        },
    },
    "CL": {
        "cryptomarket": {
            "id": "cryptomarket",
            "name": "CryptoMarket",
            "method": "Bank Transfer",
            "base_fee_usd": 1.00,
            "spread_pct": 0.30,
            "base_time_minutes": 6,
            "rating": 4.2,
            "currency": "CLP",
            "base_exchange_rate": 880.0,
        },
        "binance_p2p": {
            "id": "binance_p2p",
            "name": "Binance P2P",
            "method": "P2P Transfer",
            "base_fee_usd": 0.55,
            "spread_pct": 0.50,
            "base_time_minutes": 13,
            "rating": 4.3,
            "currency": "CLP",
            "base_exchange_rate": 885.0,
        },
    },
    "PE": {
        "crex": {
            "id": "crex",
            "name": "Crex",
            "method": "Bank Transfer",
            "base_fee_usd": 0.90,
            "spread_pct": 0.35,
            "base_time_minutes": 8,
            "rating": 4.1,
            "currency": "PEN",
            "base_exchange_rate": 3.72,
        },
        "binance_p2p": {
            "id": "binance_p2p",
            "name": "Binance P2P",
            "method": "P2P Transfer",
            "base_fee_usd": 0.55,
            "spread_pct": 0.55,
            "base_time_minutes": 12,
            "rating": 4.3,
            "currency": "PEN",
            "base_exchange_rate": 3.75,
        },
    },
}


def _jitter(value: float, pct: float = 0.02) -> float:
    if not settings.mock_jitter_enabled:
        return value
    return max(0, value * (1.0 + random.gauss(0, pct)))


def get_off_ramp_quote(provider_id: str, country: str, amount_usdc: float) -> dict | None:
    """Return off-ramp quote: USDC → local currency."""
    country_providers = OFF_RAMP_PROVIDERS.get(country, {})
    provider = country_providers.get(provider_id)
    if not provider:
        return None

    fee_usd = round(_jitter(provider["base_fee_usd"]), 2)
    spread_pct = round(_jitter(provider["spread_pct"], 0.05), 2)
    time_minutes = max(1, round(_jitter(provider["base_time_minutes"], 0.05)))
    exchange_rate = round(_jitter(provider["base_exchange_rate"], 0.005), 2)

    usdc_after_fee = amount_usdc - fee_usd
    spread_usd = round(usdc_after_fee * spread_pct / 100, 2)
    usdc_after_spread = usdc_after_fee - spread_usd
    received_local = round(usdc_after_spread * exchange_rate, 2)

    return {
        "provider": provider["name"],
        "provider_id": provider_id,
        "method": provider["method"],
        "fee_usd": fee_usd,
        "spread_pct": spread_pct,
        "spread_usd": spread_usd,
        "time_minutes": time_minutes,
        "currency": provider["currency"],
        "exchange_rate": exchange_rate,
        "received_local": received_local,
        "rating": provider["rating"],
    }
