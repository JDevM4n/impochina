from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError      # ← requiere instalar python-jose
from .db import get_settings

security = HTTPBearer(auto_error=False)

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    """
    Valida JWT emitido por tu microservicio de Auth (modo HS256 con secreto compartido).
    Requiere que el token lleve al menos { sub: userId, email: ... }.
    En dev, si no hay header Authorization, acepta X-User-Id y X-User-Email (para pruebas).
    """
    settings = get_settings()
    if creds and creds.scheme.lower() == "bearer":
        token = creds.credentials
        try:
            payload = jwt.decode(token, settings.AUTH_JWT_SECRET, algorithms=[settings.AUTH_JWT_ALG])
            user_id: str | None = payload.get("sub")
            email: str | None = payload.get("email")
            if not user_id:
                raise HTTPException(status_code=401, detail="Token sin 'sub'")
            return {"userId": user_id, "email": email}
        except JWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    # Modo dev (sin JWT): headers manuales
    # Útil mientras conectas con tu Auth MS.
    from fastapi import Request
    async def _dev_user(request: Request):
        dev_uid = request.headers.get("X-User-Id")
        dev_email = request.headers.get("X-User-Email")
        if not dev_uid:
            raise HTTPException(status_code=401, detail="Falta token o X-User-Id")
        return {"userId": dev_uid, "email": dev_email}
    return Depends(_dev_user)
