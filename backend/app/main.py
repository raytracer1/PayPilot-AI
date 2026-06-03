"""FastAPI application factory."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import quotes, simulate, transactions, info


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        description="AI-powered cross-border payment routing engine for LATAM remittances",
        version="0.1.0",
    )

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

    @app.on_event("startup")
    def on_startup():
        init_db()

    @app.get("/health")
    def health():
        return {"status": "ok", "app": settings.app_name}

    return app


app = create_app()
