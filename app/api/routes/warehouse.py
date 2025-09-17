# app/api/routes/warehouse.py
from fastapi import APIRouter, Query, HTTPException
from app.schemas.order import OrderCreate
from app.services.warehouse_service import create_order_doc, get_orders_by_usuario

router = APIRouter()

@router.get("/calculate-shipping")
async def calculate_shipping(weight: float = Query(..., description="Peso en kg")):
    tarifa_por_kg = 5.0
    price = weight * tarifa_por_kg
    if price < 2.0:
        price = 2.0
    return {"price": round(price, 2)}

@router.post("/create-order")
async def create_order(payload: OrderCreate):
    payload_dict = payload.dict()
    # status / timestamps opcionales
    payload_dict.setdefault("estado", "pendiente")
    result = await create_order_doc(payload_dict)
    return {"mensaje": "Pedido creado", "pedido": result}

@router.get("/pending-orders/{usuario}")
async def pending_orders(usuario: str):
    items = await get_orders_by_usuario(usuario)
    if not items:
        return {"pedidos": []}
    return {"pedidos": items}
