# app/auth_dep.py de ms2-orders
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from app.grpc_client import validate_token
import os

security = HTTPBearer()
AUTH_GRPC_ADDR = os.getenv("AUTH_GRPC_ADDR", "auth-service:50051")

async def get_current_user(token: str = Depends(security)):
    try:
        # Verificar token via gRPC
        user_data = validate_token(AUTH_GRPC_ADDR, token.credentials)
        
        if not user_data or "user_id" not in user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Retornar el user_id (ObjectId como string)
        return user_data["user_id"]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )