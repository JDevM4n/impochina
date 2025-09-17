from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from app.db import get_settings

security = HTTPBearer(auto_error=False)

async def get_current_user(
    request: Request,
    creds: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Si hay Authorization: Bearer <jwt> → valida y retorna {"userId","email"}.
    Si no hay, usa modo DEV con headers X-User-Id / X-User-Email.
    """
    s = get_settings()

    # 1) JWT opcional
    if creds and creds.scheme.lower() == "bearer":
        try:
            payload = jwt.decode(creds.credentials, s.AUTH_JWT_SECRET, algorithms=[s.AUTH_JWT_ALG])
            uid = payload.get("sub")
            email = payload.get("email")
            if not uid:
                raise HTTPException(status_code=401, detail="Token sin 'sub'")
            return {"userId": uid, "email": email}
        except JWTError:
            raise HTTPException(status_code=401, detail="Token inválido")

    # 2) Headers dev
    uid = request.headers.get("X-User-Id")
    if uid:
        return {"userId": uid, "email": request.headers.get("X-User-Email")}

    # 3) Sin credenciales
    raise HTTPException(status_code=401, detail="Falta Authorization o X-User-Id")
