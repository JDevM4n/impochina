"""Dependencias de seguridad (extracción y validación de token)."""
from typing import Optional

from fastapi import Header, HTTPException, status

from app.auth_client import validate_token


async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """Extrae y valida el Bearer token; retorna el username."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token",
        )
    token = authorization.split(" ", 1)[1].strip()
    valid, username, msg = validate_token(token)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {msg}",
        )
    return username
