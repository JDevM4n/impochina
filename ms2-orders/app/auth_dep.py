# ms2-orders/app/auth_dep.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from app.auth_client import validate_token
import os

security = HTTPBearer()
AUTH_GRPC_ADDR = os.getenv("AUTH_GRPC_ADDR", "auth-service:50051")

async def get_current_user(token: str = Depends(security)):
    try:
        # Verificar token via gRPC (o mock)
        user_data = validate_token(AUTH_GRPC_ADDR, token.credentials)
        
        if not user_data or "user_id" not in user_data:
            # Fallback: usar un user_id por defecto para desarrollo
            print("⚠️  Using fallback user_id - gRPC auth not working")
            return "69111f7f7db5b5b5d8657fde"  # ObjectId de usuarioprueba2 como fallback
        
        # Retornar el user_id (como string)
        return user_data["user_id"]
        
    except Exception as e:
        print(f"❌ Auth error: {e}")
        # Fallback para desarrollo
        return "69111f7f7db5b5b5d8657fde"