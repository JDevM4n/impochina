"""Wrapper de alto nivel para validar tokens usando Auth gRPC."""
import os
import app.grpc.auth_pb2 as auth_pb2
import app.grpc.auth_pb2_grpc as auth_pb2_grpc

from typing import Tuple

from app.grpc_client import validate_token as _validate_token

AUTH_GRPC_ADDR = os.getenv("AUTH_GRPC_ADDR", "host.docker.internal:50052")


def validate_token(token: str) -> Tuple[bool, str, str]:
    """Valida el token contra el servicio Auth configurado por ENV."""
    return _validate_token(AUTH_GRPC_ADDR, token)
