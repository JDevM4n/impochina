import os, grpc
from app.grpc import auth_pb2, auth_pb2_grpc

AUTH_GRPC_TARGET = os.getenv("AUTH_GRPC_TARGET", "host.docker.internal:50052")

def validate_token(token: str):
    with grpc.insecure_channel(AUTH_GRPC_TARGET) as channel:
        stub = auth_pb2_grpc.AuthServiceStub(channel)
        req  = auth_pb2.ValidateTokenRequest(token=token)
        resp = stub.ValidateToken(req)
        return resp.valid, resp.username
