"""Plaid Link integration — sandbox for dev, production for real banks."""

from fastapi import APIRouter, Depends
from plaid import ApiClient, Configuration, Environment
from plaid.api.plaid_api import PlaidApi
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.country_code import CountryCode
from plaid.model.products import Products
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest

from app.config import settings
from app.routers.auth import _get_user

router = APIRouter(prefix="/api/plaid", tags=["plaid"])


def _get_plaid_client() -> PlaidApi | None:
    if not settings.plaid_client_id or not settings.plaid_secret:
        return None
    config = Configuration(
        host=Environment.Sandbox,
        api_key={
            "clientId": settings.plaid_client_id,
            "secret": settings.plaid_secret,
        },
    )
    return PlaidApi(ApiClient(config))


@router.post("/create-link-token")
def create_link_token(current_user=Depends(_get_user)):
    """Create a Plaid Link token for the frontend to initialize Link."""
    client = _get_plaid_client()
    if client is None:
        return {
            "link_token": None,
            "error": "Plaid not configured. Set PAYPILOT_PLAID_CLIENT_ID and PAYPILOT_PLAID_SECRET.",
        }

    request = LinkTokenCreateRequest(
        user=LinkTokenCreateRequestUser(
            client_user_id=current_user.id if current_user else "demo-user",
        ),
        client_name="PayPilot AI",
        products=[Products("auth"), Products("transactions")],
        country_codes=[CountryCode("US")],
        language="en",
    )

    response = client.link_token_create(request)
    return {"link_token": response.link_token}


@router.post("/exchange-token")
def exchange_token(public_token: str = "", current_user=Depends(_get_user)):
    """Exchange a Plaid public_token for an access_token (called after Link success)."""
    client = _get_plaid_client()
    if client is None:
        return {"success": False, "error": "Plaid not configured."}

    request = ItemPublicTokenExchangeRequest(public_token=public_token)
    response = client.item_public_token_exchange(request)

    # In production: store response.access_token securely
    return {
        "success": True,
        "access_token": response.access_token,
        "item_id": response.item_id,
    }
