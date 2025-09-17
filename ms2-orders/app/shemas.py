from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

# Request para crear
class OrderCreate(BaseModel):
    productName: str = Field(min_length=1)
    quantity: int = Field(gt=0)
    shippingPrice: float = Field(ge=0)
    # Si luego llega productId desde MS1, lo agregas aquí.

# Respuesta
class OrderOut(BaseModel):
    id: str
    userId: str
    userEmail: Optional[str] = None
    productName: str
    quantity: int
    shippingPrice: float
    totalPrice: float
    createdAt: datetime
