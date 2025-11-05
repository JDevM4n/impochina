"""Rutas de órdenes."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from app.auth_dep import get_current_user
from app.db import get_db

router = APIRouter()

class ScrapedData(BaseModel):
    originalUrl: str
    originalTitle: str
    priceCNY: Optional[float] = None
    priceUSD: Optional[float] = None
    currency: Optional[str] = "CNY"
    image: Optional[str] = None

class OrderIn(BaseModel):
    productName: str
    quantity: int
    shippingPrice: float
    scrapedData: Optional[ScrapedData] = None

class OrderOut(BaseModel):
    id: str
    userId: str
    productName: str
    quantity: int
    shippingPrice: float
    totalPrice: float
    createdAt: datetime
    scrapedData: Optional[Dict[str, Any]] = None

@router.get(
    "/orders/me",
    response_model=list[OrderOut],
    description="Lista las órdenes del usuario autenticado."
)
def list_my_orders(user: str = Depends(get_current_user)):
    try:
        db = get_db()
        orders = list(db.orders.find({"userId": user}).sort("createdAt", -1))
        
        # Convertir ObjectId a string
        for order in orders:
            order["id"] = str(order["_id"])
            del order["_id"]
        
        return orders
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo órdenes: {str(e)}")

@router.post(
    "/orders",
    response_model=OrderOut,
    description="Crea una nueva orden para el usuario autenticado."
)
def create_order(body: OrderIn, user: str = Depends(get_current_user)):
    try:
        db = get_db()
        
        # Calcular precio total (puedes ajustar esta lógica)
        total_price = (body.scrapedData.priceUSD * body.quantity if body.scrapedData and body.scrapedData.priceUSD else 0) + body.shippingPrice
        
        order_data = {
            "userId": user,
            "productName": body.productName,
            "quantity": body.quantity,
            "shippingPrice": body.shippingPrice,
            "totalPrice": total_price,
            "createdAt": datetime.utcnow(),
            "scrapedData": body.scrapedData.dict() if body.scrapedData else None
        }
        
        result = db.orders.insert_one(order_data)
        
        # Retornar la orden creada
        order_data["id"] = str(result.inserted_id)
        del order_data["_id"]
        
        return OrderOut(**order_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando orden: {str(e)}")