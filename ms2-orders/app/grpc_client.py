"""Cliente gRPC compartido para Auth (validación de tokens)."""
from functools import lru_cache
from typing import Tuple
import app.grpc.auth_pb2 as auth_pb2
import app.grpc.auth_pb2_grpc as auth_pb2_grpc


import grpc

from app.grpc import auth_pb2, auth_pb2_grpc


@lru_cache(maxsize=2)
def _stub(addr: str) -> auth_pb2_grpc.AuthServiceStub:
    """Crea y cachea el stub del servicio Auth en la dirección dada."""
    channel = grpc.insecure_channel(addr)
    return auth_pb2_grpc.AuthServiceStub(channel)


def validate_token(addr: str, token: str) -> Tuple[bool, str, str]:
    """Valida un token contra Auth gRPC. Retorna (valid, username, message)."""
    try:
        # Ajusta el nombre del request al de tu .proto real:
        req = getattr(auth_pb2, "ValidateTokenRequest", None)
        if req is None:
            # Compatibilidad si tu mensaje se llama distinto (p. ej. ValidateRequest)
            req = getattr(auth_pb2, "ValidateRequest")
        request = req(token=token)

        # Idem para el método remoto (ValidateToken o Validate)
        stub = _stub(addr)
        if hasattr(stub, "ValidateToken"):
            resp = stub.ValidateToken(request, timeout=3.0)
        else:
            resp = stub.Validate(request, timeout=3.0)

        valid = bool(getattr(resp, "valid", False))
        username = getattr(resp, "username", "")
        message = getattr(resp, "message", "")
        return valid, username, message
    except grpc.RpcError as exc:
        return False, "", f"gRPC error: {exc}"
