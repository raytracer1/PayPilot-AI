"""Path analyzer — generates all possible routing combinations."""

import math

from app.services.mock_data import on_ramps, networks, off_ramps
from app.utils.constants import COUNTRIES


def analyze(amount_usd: float, country: str) -> list[dict]:
    """Generate all valid (on-ramp × network × off-ramp) path combinations.

    Each path is a dict with on_ramp, network, and off_ramp quote data.
    """
    if country not in COUNTRIES:
        return []

    # Get all on-ramp quotes
    on_ramp_quotes = []
    for pid in on_ramps.ON_RAMP_PROVIDERS:
        q = on_ramps.get_on_ramp_quote(pid, amount_usd)
        if q:
            on_ramp_quotes.append(q)

    # Get all network quotes
    network_quotes = []
    for nid in networks.L2_NETWORKS:
        q = networks.get_network_quote(nid)
        if q:
            network_quotes.append(q)

    # Get all off-ramp quotes for the destination country
    country_info = COUNTRIES[country]
    off_ramp_quotes = []
    for pid in country_info["off_ramps"]:
        # Use USDC amount from the on-ramp (approximate with amount_usd for now,
        # will be refined per-path)
        q = off_ramps.get_off_ramp_quote(pid, country, amount_usd)
        if q:
            off_ramp_quotes.append(q)

    # Cartesian product
    paths = []
    for on_q in on_ramp_quotes:
        for net_q in network_quotes:
            for off_q in off_ramp_quotes:
                # Recalculate off-ramp with actual USDC received from on-ramp
                usdc_available = on_q["usdc_received"] - net_q["gas_fee_usd"]
                actual_off = off_ramps.get_off_ramp_quote(
                    off_q["provider_id"], country, max(usdc_available, 0)
                )
                if actual_off is None:
                    continue

                path = {
                    "on_ramp": on_q,
                    "network": net_q,
                    "off_ramp": actual_off,
                }
                paths.append(path)

    return paths
