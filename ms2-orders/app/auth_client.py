"""Wrapper de alto nivel para validar tokens usando Auth gRPC."""
import os
import grpc
from typing import Tuple

# Importa los protobufs generados
import app.grpc.auth_pb2 as auth_pb2
import app.grpc.auth_pb2_grpc as auth_pb2_grpc

AUTH_GRPC_ADDR = os.getenv("AUTH_GRPC_ADDR", "auth-service:50051")

def validate_token(token: str) -> Tuple[bool, str, str]:
    """Valida el token contra el servicio Auth."""
    print(f"🔐 Validating token with auth service at: {AUTH_GRPC_ADDR}")
    
    try:
        # Crear canal gRPC
        channel = grpc.insecure_channel(AUTH_GRPC_ADDR)
        
        # Esperar a que el canal esté listo (timeout de 10 segundos)
        try:
            grpc.channel_ready_future(channel).result(timeout=10)
        except grpc.FutureTimeoutError:
            print("❌ gRPC channel timeout - auth service not reachable")
            return False, "", "Auth service not available"
        
        # Crear stub
        stub = auth_pb2_grpc.AuthServiceStub(channel)
        
        # Crear request
        request = auth_pb2.ValidateTokenRequest(token=token)
        
        print("🔄 Sending gRPC request to auth service...")
        
        # Llamar al servicio
        response = stub.ValidateToken(request, timeout=5.0)
        
        print(f"✅ Auth service response: valid={response.valid}, username={response.username}")
        
        return response.valid, response.username, getattr(response, 'message', '')
        
    except grpc.RpcError as e:
        error_msg = f"gRPC error: {e.code()} - {e.details()}"
        print(f"❌ {error_msg}")
        return False, "", error_msg
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(f"❌ {error_msg}")
        return False, "", error_msg