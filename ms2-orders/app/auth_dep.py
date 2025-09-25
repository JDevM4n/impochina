from fastapi import Header, HTTPException
from .auth_client import validate_token

def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = authorization.split(" ", 1)[1]
    ok, username = validate_token(token)
    if not ok:
        raise HTTPException(status_code=401, detail="Invalid token")
    return username
