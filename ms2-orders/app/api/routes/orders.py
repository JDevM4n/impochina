# ms2-orders/app/api/routes/orders.py
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
    item: str  # Cambiado de productName a item
    qty: int   # Cambiado de quantity a qty
    shippingPrice: float
    scrapedData: Optional[ScrapedData] = None

class OrderOut(BaseModel):
    id: str
    userId: str
    item: str
    qty: int
    shippingPrice: float
    totalPrice: float
    createdAt: datetime
    scrapedData: Optional[Dict[str, Any]] = None

@router.get(
    "/orders/me",
    response_model=list[OrderOut],
    description="Lista las órdenes del usuario autenticado."
)
def list_my_orders(user_id: str = Depends(get_current_user)):
    try:
        db = get_db()
        from bson import ObjectId
        
        # Convertir string a ObjectId para la consulta
        orders = list(db.orders.find({"userId": ObjectId(user_id)}).sort("createdAt", -1))
        
        # Convertir ObjectId a string para el response
        for order in orders:
            order["id"] = str(order["_id"])
            order["userId"] = str(order["userId"])  # Convertir ObjectId a string
            # Mapear campos antiguos a nuevos
            order["item"] = order.get("productName", order.get("item", ""))
            order["qty"] = order.get("quantity", order.get("qty", 0))
            del order["_id"]
        
        return orders
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo órdenes: {str(e)}")

@router.post(
    "/orders",
    response_model=OrderOut,
    description="Crea una nueva orden para el usuario autenticado."
)
def create_order(body: OrderIn, user_id: str = Depends(get_current_user)):
    try:
        db = get_db()
        from bson import ObjectId
        
        # Calcular precio total
        total_price = (body.scrapedData.priceUSD * body.qty if body.scrapedData and body.scrapedData.priceUSD else 0) + body.shippingPrice
        
        order_data = {
            "userId": ObjectId(user_id),  # Convertir string a ObjectId para guardar en BD
            "userEmail": f"{user_id}@example.com",  # Temporal hasta que tengamos el email real
            "productName": body.item,  # Mantener compatibilidad
            "quantity": body.qty,      # Mantener compatibilidad
            "item": body.item,         # Nuevo campo
            "qty": body.qty,           # Nuevo campo
            "shippingPrice": body.shippingPrice,
            "totalPrice": total_price,
            "createdAt": datetime.utcnow(),
            "scrapedData": body.scrapedData.dict() if body.scrapedData else None
        }
        
        result = db.orders.insert_one(order_data)
        
        # Preparar response
        order_data["id"] = str(result.inserted_id)
        order_data["userId"] = user_id  # Mantener como string en response
        del order_data["_id"]
        del order_data["productName"]  # Remover campos antiguos del response
        del order_data["quantity"]     # Remover campos antiguos del response
        
        return OrderOut(**order_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando orden: {str(e)}")