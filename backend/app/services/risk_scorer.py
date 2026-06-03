"""Risk scoring module — scores paths 1–5 on four dimensions.

Scoring factors:
1. Regulatory exposure risk (country + on-ramp modifier)
2. Network congestion / stability (L1 vs L2 reliability)
3. Exchange liquidity (off-ramp depth)
4. Intermediary count (number of hops in the payment chain)
"""

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


def _intermediary_risk(path_intermediary_count: int) -> float:
    """Risk from the number of intermediaries in the payment chain.

    Fewer hops = less exposure, fewer failure points, simpler compliance.
      2 hops (direct):   risk 1.0
      3 hops (standard):  risk 2.0
      4+ hops (complex):  risk 3.0+
    """
    if path_intermediary_count <= 2:
        return 1.0
    elif path_intermediary_count == 3:
        return 2.0
    else:
        return min(5.0, 2.0 + (path_intermediary_count - 3) * 1.0)


def compute_risk_score(
    country: str,
    on_ramp_id: str,
    network_id: str,
    off_ramp_id: str,
    intermediary_count: int = 3,
) -> dict:
    """Compute risk scores (1-5) for each dimension and an overall average.

    Args:
        country: ISO 3166-1 alpha-2 destination country code.
        on_ramp_id: On-ramp provider identifier.
        network_id: L2 network identifier.
        off_ramp_id: Off-ramp provider identifier.
        intermediary_count: Number of hops in the payment chain (default 3:
            on-ramp → network → off-ramp).

    Returns a dict with regulatory, congestion, liquidity, intermediary,
    overall scores and a risk level label.
    """
    regulatory = REGULATORY_RISK_BY_COUNTRY.get(country, 3.0)
    regulatory += REGULATORY_MODIFIER_BY_ONRAMP.get(on_ramp_id, 0.0)
    regulatory = max(1.0, min(5.0, regulatory))

    congestion = CONGESTION_RISK_BY_NETWORK.get(network_id, 3.0)
    liquidity = LIQUIDITY_RISK_BY_OFFRAMP.get(off_ramp_id, 3.0)
    intermediary = _intermediary_risk(intermediary_count)

    overall = (regulatory + congestion + liquidity + intermediary) / 4.0
    overall_rounded = round(overall)
    overall_rounded = max(1, min(5, overall_rounded))

    return {
        "regulatory": round(regulatory, 1),
        "congestion": round(congestion, 1),
        "liquidity": round(liquidity, 1),
        "intermediary": round(intermediary, 1),
        "overall": overall_rounded,
        "level": RISK_LABELS[overall_rounded],
    }
