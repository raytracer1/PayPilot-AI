"""Routing engine — AI scoring and ranking of payment paths.

Uses a weighted multi-factor optimization model. No external LLM required.
"""

import math

from app.services.risk_scorer import compute_risk_score

# User-preference → dimension weights
WEIGHTS: dict[str, dict[str, float]] = {
    "fast": {"cost": 0.15, "speed": 0.50, "risk": 0.20, "reliability": 0.15},
    "cheapest": {"cost": 0.50, "speed": 0.15, "risk": 0.20, "reliability": 0.15},
    "balanced": {"cost": 0.25, "speed": 0.25, "risk": 0.25, "reliability": 0.25},
}

# Time limits by speed preference (minutes)
TIME_LIMITS: dict[str, float] = {
    "fast": 30.0,
    "balanced": 60.0,
    "cheapest": 120.0,
}


def _compute_cost_score(total_fees_usd: float, amount_usd: float) -> float:
    """Score 0-100: higher means cheaper (lower fees)."""
    if amount_usd <= 0:
        return 0.0
    fee_pct = (total_fees_usd / amount_usd) * 100
    return max(0.0, 100.0 - (fee_pct / 5.0) * 100.0)


def _compute_speed_score(total_time_minutes: float) -> float:
    """Score 0-100: exponential decay by total time."""
    return max(0.0, 100.0 * math.exp(-0.04 * total_time_minutes))


def _compute_reliability_score(on_ramp: dict, network: dict, off_ramp: dict) -> float:
    """Score 0-100: weighted avg of ratings and reliability."""
    on_rating = on_ramp.get("rating", 4.0) / 5.0 * 100
    off_rating = off_ramp.get("rating", 4.0) / 5.0 * 100
    net_reliability = network.get("reliability_pct", 99.0)
    return round(0.3 * on_rating + 0.3 * off_rating + 0.4 * net_reliability, 1)


def _compute_risk_score_0_100(
    country: str, on_ramp: dict, network: dict, off_ramp: dict
) -> float:
    """Convert 1-5 risk to 0-100 score (higher = lower risk)."""
    risk = compute_risk_score(
        country=country,
        on_ramp_id=on_ramp.get("provider_id", ""),
        network_id=network.get("network_id", ""),
        off_ramp_id=off_ramp.get("provider_id", ""),
    )
    avg_risk = risk["overall"]
    return round(100.0 - ((avg_risk - 1.0) / 4.0) * 100.0, 1)


def rank_paths(
    raw_paths: list[dict],
    speed_preference: str,
    amount_usd: float,
    country: str,
) -> list[dict]:
    """Score and rank all paths, returning top 5 with full metadata.

    Each returned path includes:
      - id, rank, total_score
      - on_ramp, network, off_ramp info
      - summary with computed fees, times, risk
    """
    w = WEIGHTS.get(speed_preference, WEIGHTS["balanced"])
    time_limit = TIME_LIMITS.get(speed_preference, TIME_LIMITS["balanced"])

    scored = []

    for path in raw_paths:
        on = path["on_ramp"]
        net = path["network"]
        off = path["off_ramp"]

        # Total fees
        total_fee = on["fee_usd"] + on["spread_usd"] + net["gas_fee_usd"] + off["fee_usd"] + off["spread_usd"]
        total_time = on["time_minutes"] + net["time_minutes"] + off["time_minutes"]

        # Filter by time limit
        if total_time > time_limit:
            continue

        # Compute dimension scores
        cost_score = _compute_cost_score(total_fee, amount_usd)
        speed_score = _compute_speed_score(total_time)
        risk_0_100 = _compute_risk_score_0_100(country, on, net, off)
        reliability_score = _compute_reliability_score(on, net, off)

        # Weighted total
        total_score = round(
            w["cost"] * cost_score
            + w["speed"] * speed_score
            + w["risk"] * risk_0_100
            + w["reliability"] * reliability_score,
            1,
        )

        # Build summary
        usd_after_fees = round(amount_usd - total_fee, 2)
        risk_info = compute_risk_score(
            country=country,
            on_ramp_id=on.get("provider_id", ""),
            network_id=net.get("network_id", ""),
            off_ramp_id=off.get("provider_id", ""),
        )

        scored.append({
            "on_ramp": on,
            "network": net,
            "off_ramp": off,
            "total_score": total_score,
            "cost_score": round(cost_score, 1),
            "speed_score": round(speed_score, 1),
            "risk_score_0_100": risk_0_100,
            "reliability_score": reliability_score,
            "summary": {
                "total_fee_usd": round(total_fee, 2),
                "total_time_minutes": total_time,
                "usd_received_after_fees": usd_after_fees,
                "received_local": off["received_local"],
                "received_usd_equivalent": round(off["received_local"] / off["exchange_rate"], 2),
                "currency": off["currency"],
                "risk_score": risk_info["overall"],
                "risk_level": risk_info["level"],
                "risk_breakdown": risk_info,
                "efficiency_score": round(
                    (usd_after_fees / amount_usd) * 100, 1
                ),
                "speed_label": (
                    "fast" if total_time <= 20
                    else "medium" if total_time <= 45
                    else "slow"
                ),
            },
        })

    # Sort by total_score descending
    scored.sort(key=lambda x: x["total_score"], reverse=True)

    # Assign ranks and IDs
    ranked = []
    for i, p in enumerate(scored[:5]):
        path_id = f"path_{p['on_ramp']['provider_id']}_{p['network']['network_id']}_{p['off_ramp']['provider_id']}"
        ranked.append({
            "id": path_id,
            "rank": i + 1,
            "total_score": p["total_score"],
            "cost_score": p["cost_score"],
            "speed_score": p["speed_score"],
            "risk_score_0_100": p["risk_score_0_100"],
            "reliability_score": p["reliability_score"],
            "on_ramp": {
                k: v for k, v in p["on_ramp"].items()
                if k not in ("provider_id",)
            },
            "network": {
                k: v for k, v in p["network"].items()
                if k not in ("network_id",)
            },
            "off_ramp": {
                k: v for k, v in p["off_ramp"].items()
                if k not in ("provider_id",)
            },
            "summary": p["summary"],
        })

    return ranked
