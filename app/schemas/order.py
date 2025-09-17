# app/schemas/order.py
from pydantic import BaseModel, HttpUrl
from typing import Optional

class OrderCreate(BaseModel):
    usuario: str
    producto: str
    direccion: str
    imagen: Optional[HttpUrl] = None
    peso: float
    costo_envio: float
