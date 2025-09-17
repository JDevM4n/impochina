from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class OrderDB(BaseModel):
    id: str | None = None
    userId: str
    userEmail: Optional[str] = None
    productName: str
    quantity: int = Field(gt=0)
    shippingPrice: float = Field(ge=0)
    totalPrice: float = Field(ge=0)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
