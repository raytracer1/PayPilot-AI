"""FastAPI application factory — PayPilot AI v3.

Security architecture:
- No private keys stored in this application.
- All fiat operations delegated to third-party providers (Stripe, MoonPay, Transak).
- USDC transfers simulated via mock data; real integration uses Circle APIs.
- Wallet credentials, if ever needed, stored in a secure vault (mock for MVP).
- Every operation is logged to the audit trail for compliance.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.database import init_db
from app.routers import quotes, simulate, transactions, info, audit, auth, account


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to every response."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Cache-Control"] = "no-store"
        # Mark all responses as simulated
        response.headers["X-PayPilot-Mode"] = "SIMULATION"
        response.headers["X-PayPilot-Disclaimer"] = "Demo only. No real funds."
        return response


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        description=(
            "Secure AI-powered cross-border payment orchestration engine "
            "for LATAM remittances. Simulation-first design — no real funds "
            "are ever custodied by this application."
        ),
        version="3.0.0",
    )

    # Security headers (applied first — outermost layer)
    app.add_middleware(SecurityHeadersMiddleware)

    # CORS — allow frontend dev server
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(quotes.router)
    app.include_router(simulate.router)
    app.include_router(transactions.router)
    app.include_router(info.router)
    app.include_router(audit.router)
    app.include_router(auth.router)
    app.include_router(account.router)

    @app.on_event("startup")
    def on_startup():
        init_db()

    @app.get("/health")
    def health():
        return {"status": "ok", "app": settings.app_name, "mode": "SIMULATION"}

    return app


app = create_app()
