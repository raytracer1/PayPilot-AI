"""Routing engine — AI scoring and ranking of payment paths.

Uses a weighted multi-factor optimization model. No external LLM required.
"""

import math

from app.services.risk_scorer import compute_risk_score

# User-preference → dimension weights
WEIGHTS: dict[str, dict[str, float]] = {
    "fast": {"cost": 0.05, "speed": 0.60, "risk": 0.20, "reliability": 0.15},
    "cheapest": {"cost": 0.70, "speed": 0.05, "risk": 0.15, "reliability": 0.10},
    "balanced": {"cost": 0.25, "speed": 0.25, "risk": 0.25, "reliability": 0.25},
}

# Time limits by speed preference (minutes)
TIME_LIMITS: dict[str, float] = {
    "fast": 60.0,         # Under 1 hour — card/crypto only
    "balanced": 4320.0,   # 3 days — shows all options with balanced scoring
    "cheapest": 7200.0,   # 5 days — includes slowest methods
}


def _compute_cost_score(total_fees_usd: float, amount_usd: float) -> float:
    """Score 0-100: higher means cheaper (lower fees)."""
    if amount_usd <= 0:
        return 0.0
    fee_pct = (total_fees_usd / amount_usd) * 100
    return max(0.0, 100.0 - (fee_pct / 5.0) * 100.0)


def _compute_speed_score(total_time_minutes: float) -> float:
    """Score 0-100: exponential decay.
    -0.001 decay means: 10min→99, 1h→94, 1d→24, 2d→6, 3d→0.7
    This keeps multi-day differences distinguishable."""
    return max(0.0, 100.0 * math.exp(-0.001 * total_time_minutes))


def _compute_reliability_score(on_ramp: dict, network: dict, off_ramp: dict) -> float:
    """Score 0-100: weighted avg of ratings and reliability."""
    on_rating = on_ramp.get("rating", 4.0) / 5.0 * 100
    off_rating = off_ramp.get("rating", 4.0) / 5.0 * 100
    net_reliability = network.get("reliability_pct", 99.0)
    return round(0.3 * on_rating + 0.3 * off_rating + 0.4 * net_reliability, 1)


def _compute_risk_score_0_100(
    country: str, on_ramp: dict, network: dict, off_ramp: dict,
    intermediary_count: int = 3,
) -> float:
    """Convert 1-5 risk to 0-100 score (higher = lower risk)."""
    risk = compute_risk_score(
        country=country,
        on_ramp_id=on_ramp.get("provider_id", ""),
        network_id=network.get("network_id", ""),
        off_ramp_id=off_ramp.get("provider_id", ""),
        intermediary_count=intermediary_count,
    )
    avg_risk = risk["overall"]
    return round(100.0 - ((avg_risk - 1.0) / 4.0) * 100.0, 1)


def analyze_paths(
    raw_paths: list[dict],
    amount_usd: float,
    country: str,
    currency: str = "USDT",
    recipient_type: str = "bank",
) -> list[dict]:
    """Analyze all paths — compute dimension scores, dedup where needed.

    USDC mode: dedup by network+off_ramp (on-ramp free for all), keep best rated.
    USDT mode: keep all paths (on-ramp fees differ meaningfully).
    """
    # USDC: sort by on_ramp rating so dedup keeps the best
    sorted_raw = (
        sorted(raw_paths, key=lambda p: p["on_ramp"]["rating"], reverse=True)
        if currency == "USDC" else raw_paths
    )

    paths = []
    seen = set()
    for path in sorted_raw:
        on = path["on_ramp"]
        net = path["network"]
        off = path["off_ramp"]

        # Wallet recipient: no off-ramp needed, just L2 transfer to recipient wallet
        is_wallet = recipient_type == "wallet"

        if currency == "USDC":
            on_fee, on_spread, on_time = 0.0, 0.0, 0
        else:
            on_fee, on_spread, on_time = on["fee_usd"], on["spread_usd"], on["time_minutes"]

        if is_wallet:
            off_fee, off_spread, off_time = 0.0, 0.0, 0
        else:
            off_fee, off_spread, off_time = off["fee_usd"], off["spread_usd"], off["time_minutes"]

        total_fee = round(
            round(on_fee, 2) + round(on_spread, 2) + round(net["gas_fee_usd"], 4) +
            round(off_fee, 2) + round(off_spread, 2), 2)
        total_time = on_time + net["time_minutes"] + off_time

        risk_info = compute_risk_score(
            country=country,
            on_ramp_id=on.get("provider_id", ""),
            network_id=net.get("network_id", ""),
            off_ramp_id=off.get("provider_id", ""),
            intermediary_count=3,
        )

        path_id = f"path_{on['provider_id']}_{net['network_id']}_{off['provider_id']}"

        # USDC: dedup by network+off_ramp (keep highest-rated on_ramp, already sorted)
        if currency == "USDC":
            key = f"{net['network_id']}_{off['provider_id']}"
            if key in seen:
                continue
            seen.add(key)

        paths.append({
            "id": path_id,
            "on_ramp": (
                None if currency == "USDC" else
                {k: v for k, v in on.items() if k not in ("provider_id",)}
            ),
            "network": {k: v for k, v in net.items() if k not in ("network_id",)},
            "off_ramp": (
                None if is_wallet else
                {k: v for k, v in off.items() if k not in ("provider_id",)}
            ),
            "summary": {
                "input_amount_usd": amount_usd,
                "total_fee_usd": total_fee,
                "total_time_minutes": total_time,
                "on_ramp_fee_usd": round(on_fee + on_spread, 2),
                "on_ramp_time_minutes": on_time,
                "gas_fee_usd": net["gas_fee_usd"],
                "off_ramp_fee_usd": round(off_fee + off_spread, 2),
                "received_local": round(amount_usd - on_fee - on_spread - net["gas_fee_usd"], 2) if is_wallet else off["received_local"],
                "currency": "USDC" if is_wallet else off["currency"],
                "exchange_rate": 1.0 if is_wallet else off["exchange_rate"],
                "risk_score": risk_info["overall"],
                "risk_level": risk_info["level"],
                "risk_breakdown": risk_info,
            },
        })

    return paths
