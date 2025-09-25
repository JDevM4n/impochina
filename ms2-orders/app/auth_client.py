import os
import grpc
from app.grpc import auth_pb2, auth_pb2_grpc

AUTH_GRPC_ADDR = os.getenv("AUTH_GRPC_ADDR", "host.docker.internal:50051")

_channel = None
_stub = None

def _stub():
    global _channel, _stub
    if _channel is None or _stub is None:
        _channel = grpc.insecure_channel(AUTH_GRPC_ADDR)
        _stub = auth_pb2_grpc.AuthServiceStub(_channel)
    return _stub

def verify_token_via_grpc(token: str) -> str:
    stub = _stub()
    resp = stub.VerifyToken(auth_pb2.VerifyTokenRequest(token=token), timeout=3.0)
    if not resp.valid:
        raise ValueError(resp.error or "invalid token")
    return resp.username
