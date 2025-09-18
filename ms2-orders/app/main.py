from datetime import datetime
from typing import List
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId

from app.db import connect, disconnect, ensure_db
from app.schemas import OrderCreate, OrderOut
from app.auth_dep import get_current_user

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app = FastAPI(title="Orders MS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def _startup(): await connect()

@app.on_event("shutdown")
async def _shutdown(): await disconnect()

def serialize(doc) -> OrderOut:
    return OrderOut(
        id=str(doc["_id"]),
        userId=doc["userId"],
        productName=doc["productName"],
        quantity=doc["quantity"],
        shippingPrice=float(doc["shippingPrice"]),
        totalPrice=float(doc["totalPrice"]),
        createdAt=doc["createdAt"],
    )

@app.get("/health")
async def health(): return {"ok": True, "service": "orders"}

@app.post("/orders", response_model=OrderOut, status_code=201)
async def create_order(
    payload: OrderCreate,
    user: dict = Depends(get_current_user),
    db = Depends(ensure_db)
):
    doc = {
        "userId": user["userId"],
        "productName": payload.productName,
        "quantity": payload.quantity,
        "shippingPrice": float(payload.shippingPrice),
        "totalPrice": float(payload.quantity * payload.shippingPrice),
        "createdAt": datetime.utcnow(),
    }
    res = await db.orders.insert_one(doc)
    saved = await db.orders.find_one({"_id": res.inserted_id})
    return serialize(saved)

@app.get("/orders/me", response_model=List[OrderOut])
async def my_orders(
    user: dict = Depends(get_current_user),
    db = Depends(ensure_db)
):
    cursor = db.orders.find({"userId": user["userId"]}).sort("createdAt", -1)
    return [serialize(d) async for d in cursor]

@app.get("/orders/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: str,
    user: dict = Depends(get_current_user),
    db = Depends(ensure_db)
):
    try:
        oid = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="order_id inválido")
    found = await db.orders.find_one({"_id": oid, "userId": user["userId"]})
    if not found:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return serialize(found)
