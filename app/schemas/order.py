# app/schemas/order.py
from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional
from datetime import datetime

class ProductItem(BaseModel):
    product_id: str
    name: str
    image_url: Optional[HttpUrl] = None
    weight_kg: float
    quantity: int = 1

class OrderCreate(BaseModel):
    order_id: Optional[str] = None           # id del MS1 si lo tienes
    address: str
    products: List[ProductItem]
    # opcionales (si front manda)
    user_id: Optional[str] = None
    user_name: Optional[str] = None

class ShippingCalcRequest(BaseModel):
    delivery_option: Optional[str] = "consolidated"
    selected_product_ids: Optional[List[str]] = None
