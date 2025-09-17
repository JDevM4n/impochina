# app/core/auth.py
from fastapi import Header, HTTPException
from typing import Optional
import httpx
import jwt
from app.core.config import AUTH_INTROSPECTION_URL, JWT_PUBLIC_KEY, JWT_ALGORITHM

async def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Devuelve dict {user_id, user_name}.
    - Si AUTH_INTROSPECTION_URL está configurado, la usa.
    - Si no, intenta decodificar el JWT (si JWT_PUBLIC_KEY está presente lo verifica,
      si no lo decodifica SIN verificar signature — solo para dev).
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = parts[1]

    if AUTH_INTROSPECTION_URL:
        async with httpx.AsyncClient() as client:
            try:
                r = await client.post(AUTH_INTROSPECTION_URL, json={"token": token}, timeout=5.0)
            except Exception:
                raise HTTPException(status_code=502, detail="Auth service unreachable")
            if r.status_code != 200:
                raise HTTPException(status_code=401, detail="Token invalid")
            data = r.json()
            # espera {active: true, sub: user_id, name: user_name} o similar
            if not data.get("active", True):
                raise HTTPException(status_code=401, detail="Token not active")
            return {"user_id": data.get("sub") or data.get("user_id"), "user_name": data.get("name")}
    else:
        # fallback: decode JWT locally
        try:
            if JWT_PUBLIC_KEY:
                payload = jwt.decode(token, JWT_PUBLIC_KEY, algorithms=[JWT_ALGORITHM])
            else:
                # WARNING: sin verificación. Solo para desarrollo.
                payload = jwt.decode(token, options={"verify_signature": False})
            return {"user_id": payload.get("sub") or payload.get("user_id"), "user_name": payload.get("name") or payload.get("username")}
        except jwt.PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
