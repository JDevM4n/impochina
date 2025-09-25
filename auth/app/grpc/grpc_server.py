import os
import time
import jwt
import grpc
from concurrent import futures

from app.grpc import auth_pb2, auth_pb2_grpc

# Reflection para debug con grpcurl
from grpc_reflection.v1alpha import reflection

SECRET_KEY = os.environ.get("SECRET_KEY", "mysecretkey")
JWT_ALG    = os.environ.get("JWT_ALG", "HS256")
GRPC_PORT  = int(os.environ.get("GRPC_PORT", "50051"))

class AuthService(auth_pb2_grpc.AuthServiceServicer):
    def ValidateToken(self, request, context):
        token = request.token or ""
        if not token:
            return auth_pb2.ValidateTokenResponse(valid=False, error="empty token")

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALG])
            username = payload.get("username")
            if not username:
                return auth_pb2.ValidateTokenResponse(valid=False, error="username missing")
            return auth_pb2.ValidateTokenResponse(valid=True, username=username)
        except jwt.ExpiredSignatureError:
            return auth_pb2.ValidateTokenResponse(valid=False, error="token expired")
        except jwt.InvalidTokenError:
            return auth_pb2.ValidateTokenResponse(valid=False, error="invalid token")
        except Exception as e:
            return auth_pb2.ValidateTokenResponse(valid=False, error=str(e))

def build_grpc_server() -> grpc.Server:
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    auth_pb2_grpc.add_AuthServiceServicer_to_server(AuthService(), server)

    # Habilitar reflection
    SERVICE_NAMES = (
        auth_pb2.DESCRIPTOR.services_by_name['AuthService'].full_name,
        reflection.SERVICE_NAME,
    )
    reflection.enable_server_reflection(SERVICE_NAMES, server)

    server.add_insecure_port(f"[::]:{GRPC_PORT}")
    return server
