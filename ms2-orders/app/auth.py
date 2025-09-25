from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from app.db import get_settings

security = HTTPBearer(auto_error=False)

async def get_current_user(
    request: Request,
    creds: HTTPAuthorizationCredentials = Depends(security),
):
    s = get_settings()

    if not creds or creds.scheme.lower() != "bearer":
        if s.DEV_HEADERS_FALLBACK:
            uid = request.headers.get("X-User-Id")
            if uid:
                return {"userId": uid}
        raise HTTPException(status_code=401, detail="Falta Authorization: Bearer <token>")

    try:
        options = {"verify_aud": bool(s.AUTH_JWT_AUD)}
        payload = jwt.decode(
            creds.credentials,
            s.AUTH_JWT_SECRET,
            algorithms=[s.AUTH_JWT_ALG],
            audience=s.AUTH_JWT_AUD if s.AUTH_JWT_AUD else None,
            issuer=s.AUTH_JWT_ISS if s.AUTH_JWT_ISS else None,
            options=options,
        )
        uid = payload.get("sub")          # ← viene del Auth (username)
        if not uid:
            raise HTTPException(status_code=401, detail="Token sin 'sub'")
        return {"userId": uid}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
