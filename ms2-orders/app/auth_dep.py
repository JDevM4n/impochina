from fastapi import Header, HTTPException, status
from .auth_client import validate_token


def get_current_user(authorization: str = Header(None)) -> str:
    """Extrae el Bearer token, lo valida y retorna el username."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token",
        )

    token = authorization.split(" ", 1)[1].strip()

    ok, username, msg = validate_token(token) 
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {msg}",  
        )

    return username
