"""Pydantic schemas for SIWE (Sign-In with Ethereum)."""

from pydantic import BaseModel, Field


class NonceResponse(BaseModel):
    nonce: str
    message: str
    # The message the user must sign in their wallet


class VerifyRequest(BaseModel):
    message: str
    signature: str = Field(..., description="Hex-encoded wallet signature")
    wallet_address: str = Field(
        ..., min_length=42, max_length=42, description="0x-prefixed checksummed address"
    )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
