from pydantic import BaseModel
from typing import Optional

class Order(BaseModel):
    usuario: str
    producto: str
    direccion: str
    imagen: str
    peso: float
    costo_envio: float
    estado: Optional[str] = "pendiente"
