import os
from typing import Optional
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt

SECRET_KEY = os.environ.get("SECRET_KEY", "mysecretkey")
security = HTTPBearer(auto_error=False)

def _extract_bearer_token(request: Request, creds: Optional[HTTPAuthorizationCredentials]):
    # 1) Parseo manual del header (robusto ante mayúsculas/minúsculas y espacios)
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1].strip()

    # 2) Fallback al esquema de FastAPI si vino correcto
    if creds and getattr(creds, "scheme", None) and creds.scheme.lower() == "bearer":
        return (creds.credentials or "").strip()

    return None

async def get_current_user(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    token = _extract_bearer_token(request, creds)

    # 3) Fallback de desarrollo: permitir X-User-Id si se activa DEV_HEADERS_FALLBACK=true
    if not token:
        if os.getenv("DEV_HEADERS_FALLBACK", "false").lower() == "true":
            dev_user = request.headers.get("x-user-id")
            if dev_user:
                return {"userId": dev_user}
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        username = payload.get("username")
        if not username:
            raise HTTPException(status_code=401, detail="Token missing 'username'")
        return {"userId": username}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
