# app/api/routes/warehouse.py
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.order import OrderCreate, ShippingCalcRequest
from app.core.auth import get_current_user
from app.services import warehouse_service, cost_service
from app.core.config import MICROSERVICE1_URL
import httpx

router = APIRouter()

@router.post("/orders", status_code=201)
async def create_order(payload: OrderCreate, user=Depends(get_current_user)):
    # user -> {user_id, user_name}
    order_doc = payload.dict()
    # fill user if not provided by front
    order_doc["user_id"] = order_doc.get("user_id") or user.get("user_id")
    order_doc["user_name"] = order_doc.get("user_name") or user.get("user_name")
    _id = await warehouse_service.create_order_doc(order_doc)
    return {"order_id": _id}

@router.get("/orders/pending")
async def get_pending_orders(user_id: str = None):
    # Si user_id dado -> filtra por usuario; si no -> devuelve todos pendientes
    if user_id:
        items = await warehouse_service.get_orders_by_user(user_id, status="pendiente")
    else:
        # all pending
        cursor = warehouse_service.db.orders.find({"status": "pendiente"}).sort("created_at", -1)
        items = await cursor.to_list(length=200)
        for d in items:
            d["id"] = str(d["_id"]); d.pop("_id", None)
    return {"orders": items}

@router.get("/user/{user_id}/orders")
async def get_user_orders(user_id: str):
    items = await warehouse_service.get_orders_by_user(user_id)
    if not items:
        return {"message": "No hay pedidos", "orders": []}
    return {"orders": items}

@router.post("/{order_id}/calculate")
async def calculate(order_id: str, body: ShippingCalcRequest):
    order = await warehouse_service.get_order_by_id(order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    # compute weight based on selection
    if body.delivery_option == "individual" and body.selected_product_ids:
        total_weight = 0.0
        for p in order.get("products", []):
            if p.get("product_id") in body.selected_product_ids:
                total_weight += p.get("weight_kg", 0) * p.get("quantity", 1)
    else:
        total_weight = order.get("total_weight_kg", 0.0)
    shipping_cost = cost_service.calculate_shipping_cost(total_weight)
    updated = await warehouse_service.update_order(order_id, {"total_weight_kg": total_weight, "shipping_cost": shipping_cost, "delivery_option": body.delivery_option})
    return {"shipping_cost": shipping_cost, "total_weight": total_weight, "order": updated}

@router.post("/{order_id}/photos")
async def add_photos(order_id: str, photos: list[str]):
    order = await warehouse_service.get_order_by_id(order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    new_photos = order.get("photos", []) + photos
    updated = await warehouse_service.update_order(order_id, {"photos": new_photos})
    return {"order": updated}

# Optional: endpoint to get order data from microservice1 (if you want)
@router.get("/from-ms1/{remote_order_id}")
async def fetch_from_ms1(remote_order_id: str):
    url = f"{MICROSERVICE1_URL}/api/orders/{remote_order_id}"
    async with httpx.AsyncClient() as client:
        r = await client.get(url, timeout=8.0)
    if r.status_code != 200:
        raise HTTPException(502, "MS1 error")
    return r.json()
