"""Risk scoring module — scores paths 1–5 on three dimensions."""

# Base regulatory risk per country (1=lowest, 5=highest)
REGULATORY_RISK_BY_COUNTRY: dict[str, float] = {
    "MX": 2.0,
    "BR": 2.0,
    "AR": 4.0,
    "CO": 3.0,
    "CL": 2.0,
    "PE": 3.0,
}

# On-ramp provider regulatory modifier (negative = reduces risk)
REGULATORY_MODIFIER_BY_ONRAMP: dict[str, float] = {
    "coinbase": -0.5,
    "moonpay": -0.3,
    "transak": -0.3,
    "binance": 0.0,
}

# Network congestion risk (1=lowest)
CONGESTION_RISK_BY_NETWORK: dict[str, float] = {
    "base": 2.0,
    "polygon": 3.0,
    "solana": 2.0,
}

# Off-ramp liquidity risk (1=lowest)
LIQUIDITY_RISK_BY_OFFRAMP: dict[str, float] = {
    "bitso": 1.0,
    "mercadopago": 1.0,
    "belo": 3.0,
    "buenbit": 2.0,
    "cryptomarket": 2.0,
    "crex": 3.0,
    "binance_p2p": 2.0,
}

RISK_LABELS: dict[int, str] = {
    1: "very_low",
    2: "low",
    3: "medium",
    4: "high",
    5: "very_high",
}


def compute_risk_score(
    country: str,
    on_ramp_id: str,
    network_id: str,
    off_ramp_id: str,
) -> dict:
    """Compute risk scores (1-5) for each dimension and an overall average.

    Returns a dict with regulatory, congestion, liquidity, overall scores
    and a risk level label.
    """
    regulatory = REGULATORY_RISK_BY_COUNTRY.get(country, 3.0)
    regulatory += REGULATORY_MODIFIER_BY_ONRAMP.get(on_ramp_id, 0.0)
    regulatory = max(1.0, min(5.0, regulatory))

    congestion = CONGESTION_RISK_BY_NETWORK.get(network_id, 3.0)
    liquidity = LIQUIDITY_RISK_BY_OFFRAMP.get(off_ramp_id, 3.0)

    overall = (regulatory + congestion + liquidity) / 3.0
    overall_rounded = round(overall)
    overall_rounded = max(1, min(5, overall_rounded))

    return {
        "regulatory": round(regulatory, 1),
        "congestion": round(congestion, 1),
        "liquidity": round(liquidity, 1),
        "overall": overall_rounded,
        "level": RISK_LABELS[overall_rounded],
    }
