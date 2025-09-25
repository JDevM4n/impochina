import os
import grpc
from functools import lru_cache
from typing import Tuple
from app.grpc import auth_pb2, auth_pb2_grpc  # se generan en build

def _addr() -> str:
    # Ahora usas el Auth que ya publicaste en 50052
    return os.environ.get("AUTH_GRPC_ADDR", "host.docker.internal:50052")

@lru_cache(maxsize=1)
def _stub() -> auth_pb2_grpc.AuthServiceStub:
    ch = grpc.insecure_channel(_addr())
    return auth_pb2_grpc.AuthServiceStub(ch)

def validate_token(token: str) -> Tuple[bool, str, str]:
    """Devuelve (valid, username, message)."""
    try:
        req = auth_pb2.ValidateRequest(token=token)
        res = _stub().ValidateToken(req, timeout=3.0)
        return res.valid, res.username, res.message
    except Exception as e:
        return False, "", f"gRPC error: {e}"
