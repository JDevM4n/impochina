# ms2-orders/app/auth_client.py
"""Mock auth client for development"""
import os
from typing import Optional, Dict

# Simular la respuesta del servicio gRPC de auth
def validate_token(addr: str, token: str) -> Optional[Dict]:
    """
    Mock function para desarrollo - simula la validación de token
    En producción, esto debería conectar al servicio gRPC real
    """
    try:
        # TODO: Reemplazar con llamada gRPC real al auth-service
        # Por ahora, retornamos un mock con el user_id correcto
        return {
            "username": "mock_user",
            "user_id": "69111f7f7db5b5b5d8657fde"  # ObjectId de usuarioprueba2
        }
    except Exception as e:
        print(f"Mock auth error: {e}")
        return None