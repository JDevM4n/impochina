from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Pedido(BaseModel):
    id: Optional[str]
    usuario: str
    producto: str
    direccion: str
    peso: float
    costo_envio: float
    imagen: str
    fecha: datetime = datetime.utcnow()
