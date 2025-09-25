import os
from typing import Optional
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.grpc.auth_client import verify_token_via_grpc

security = HTTPBearer(auto_error=False)

def _extract_bearer_token(request: Request, creds: Optional[HTTPAuthorizationCredentials]):
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1].strip()
    if creds and getattr(creds, "scheme", "").lower() == "bearer":
        return (creds.credentials or "").strip()
    return None

async def get_current_user(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    token = _extract_bearer_token(request, creds)

    # Fallback solo dev
    if not token and os.getenv("DEV_HEADERS_FALLBACK", "false").lower() == "true":
        dev_user = request.headers.get("x-user-id")
        if dev_user:
            return {"userId": dev_user}

    if not token:
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    try:
        username = verify_token_via_grpc(token)
        return {"userId": username}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
