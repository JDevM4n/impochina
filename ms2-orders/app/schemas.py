from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class OrderCreate(BaseModel):
    productName: str = Field(min_length=1)
    quantity: int = Field(gt=0)
    shippingPrice: float = Field(ge=0)

class OrderOut(BaseModel):
    id: str
    userId: str
    userEmail: Optional[str] = None
    productName: str
    quantity: int
    shippingPrice: float
    totalPrice: float
    createdAt: datetime
