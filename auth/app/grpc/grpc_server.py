# auth/app/grpc_server.py
import os
import time
import jwt
import grpc
from concurrent import futures

# Importar la colección de usuarios
from app.db import users_collection
from app.grpc import auth_pb2, auth_pb2_grpc

# Reflection para debug
try:
    from grpc_reflection.v1alpha import reflection
except ImportError:
    reflection = None

SECRET_KEY = os.environ.get("SECRET_KEY", "mysecretkey")
JWT_ALG = os.environ.get("JWT_ALG", "HS256")
GRPC_PORT = int(os.environ.get("GRPC_PORT", "50051"))

class AuthService(auth_pb2_grpc.AuthServiceServicer):
    def ValidateToken(self, request, context):
        print(f"🔐 Validating token: {request.token[:20]}...")  # Debug
        token = request.token or ""
        
        if not token:
            return auth_pb2.ValidateTokenResponse(valid=False, error="empty token")

        try:
            # Decodificar el token JWT
            payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALG])
            username = payload.get("username")
            print(f"📧 Username from token: {username}")  # Debug
            
            if not username:
                return auth_pb2.ValidateTokenResponse(valid=False, error="username missing")
            
            # Buscar el usuario en la base de datos
            db_user = users_collection.find_one({"username": username})
            
            if not db_user:
                print(f"❌ User not found: {username}")  # Debug
                return auth_pb2.ValidateTokenResponse(valid=False, error="user not found")
            
            # Retornar el user_id como string
            user_id = str(db_user["_id"])
            print(f"🆔 User ID to return: {user_id}")  # Debug
            
            return auth_pb2.ValidateTokenResponse(
                valid=True, 
                username=username,
                user_id=user_id  # ← ESTO ES LO MÁS IMPORTANTE
            )
            
        except jwt.ExpiredSignatureError:
            return auth_pb2.ValidateTokenResponse(valid=False, error="token expired")
        except jwt.InvalidTokenError as e:
            print(f"❌ Invalid token: {e}")  # Debug
            return auth_pb2.ValidateTokenResponse(valid=False, error="invalid token")
        except Exception as e:
            print(f"💥 Unexpected error: {e}")  # Debug
            return auth_pb2.ValidateTokenResponse(valid=False, error=str(e))

def build_grpc_server() -> grpc.Server:
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    auth_pb2_grpc.add_AuthServiceServicer_to_server(AuthService(), server)
    
    # Habilitar reflection si está disponible
    if reflection:
        SERVICE_NAMES = (
            auth_pb2.DESCRIPTOR.services_by_name['AuthService'].full_name,
            reflection.SERVICE_NAME,
        )
        reflection.enable_server_reflection(SERVICE_NAMES, server)
    
    server.add_insecure_port(f"[::]:{GRPC_PORT}")
    return server