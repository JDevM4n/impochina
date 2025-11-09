# En auth-service/app/grpc_server.py - MODIFICAR ESTE ARCHIVO
import os
import time
import jwt
import grpc
from concurrent import futures
from bson import ObjectId

# IMPORTAR LA COLECCIÓN DE USUARIOS
from app.db import users_collection
from app.grpc import auth_pb2, auth_pb2_grpc

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
            
            # OBTENER EL USUARIO COMPLETO DE LA BASE DE DATOS
            db_user = users_collection.find_one({"username": username})
            if not db_user:
                return auth_pb2.ValidateTokenResponse(valid=False, error="user not found")
            
            # RETORNAR EL user_id CORRECTO
            return auth_pb2.ValidateTokenResponse(
                valid=True, 
                username=username,
                user_id=str(db_user["_id"])  # ← ESTA LÍNEA ES CLAVE
            )
            
        except jwt.ExpiredSignatureError:
            return auth_pb2.ValidateTokenResponse(valid=False, error="token expired")
        except jwt.InvalidTokenError:
            return auth_pb2.ValidateTokenResponse(valid=False, error="invalid token")
        except Exception as e:
            return auth_pb2.ValidateTokenResponse(valid=False, error=str(e))

def build_grpc_server() -> grpc.Server:
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    auth_pb2_grpc.add_AuthServiceServicer_to_server(AuthService(), server)
    
    # Reflection (opcional)
    from grpc_reflection.v1alpha import reflection
    SERVICE_NAMES = (
        auth_pb2.DESCRIPTOR.services_by_name['AuthService'].full_name,
        reflection.SERVICE_NAME,
    )
    reflection.enable_server_reflection(SERVICE_NAMES, server)
    
    server.add_insecure_port(f"[::]:{GRPC_PORT}")
    return server