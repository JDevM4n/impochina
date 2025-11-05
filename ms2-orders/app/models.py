from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class ScrapedData(BaseModel):
    originalUrl: str
    originalTitle: str
    priceCNY: Optional[float] = None
    priceUSD: Optional[float] = None
    currency: Optional[str] = "CNY"
    image: Optional[str] = None

class OrderDB(BaseModel):
    id: str | None = None
    userId: str
    productName: str
    quantity: int = Field(gt=0)
    shippingPrice: float = Field(ge=0)
    totalPrice: float = Field(ge=0)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    scrapedData: Optional[Dict[str, Any]] = None