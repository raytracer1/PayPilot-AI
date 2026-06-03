"""GET /api/info/* — static reference data for the frontend."""

from fastapi import APIRouter

from app.services.mock_data.on_ramps import ON_RAMP_PROVIDERS
from app.services.mock_data.networks import L2_NETWORKS
from app.utils.constants import COUNTRIES, SUPPORTED_COUNTRIES, SPEED_PREFERENCES

router = APIRouter(prefix="/api", tags=["info"])


@router.get("/info/onramps")
def get_onramps():
    """List all available on-ramp providers."""
    providers = []
    for pid, p in ON_RAMP_PROVIDERS.items():
        providers.append({
            "id": pid,
            "name": p["name"],
            "methods": [p["method"]],
            "rating": p["rating"],
            "supported_countries": p["supported_countries"],
            "max_amount": p["max_amount"],
        })
    return {"providers": providers}


@router.get("/info/networks")
def get_networks():
    """List all available L2 networks."""
    nets = []
    for nid, n in L2_NETWORKS.items():
        nets.append({
            "id": nid,
            "name": n["name"],
            "layer": n["layer"],
            "base_gas_fee_usd": n["base_gas_fee_usd"],
            "base_time_minutes": n["base_time_minutes"],
            "reliability_pct": n["reliability_pct"],
            "tps": n["tps"],
        })
    return {"networks": nets}


@router.get("/info/countries")
def get_countries():
    """List all supported destination countries."""
    countries = []
    for code in SUPPORTED_COUNTRIES:
        c = COUNTRIES[code]
        countries.append({
            "code": code,
            "name": c["name"],
            "currency": c["currency"],
            "currency_symbol": c["currency_symbol"],
            "flag": c["flag"],
            "off_ramps": c["off_ramps"],
        })
    return {"countries": countries}


@router.get("/info/preferences")
def get_preferences():
    """List supported speed preferences."""
    return {"preferences": SPEED_PREFERENCES}
