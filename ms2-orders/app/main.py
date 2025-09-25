from typing import List
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId

from app.db import connect, disconnect, ensure_db, get_settings
from app.schemas import OrderCreate, OrderOut
from app.auth import get_current_user

app = FastAPI(title="Orders MS (username token)")
s = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in s.ALLOW_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup(): await connect()

@app.on_event("shutdown")
async def shutdown(): await disconnect()

def serialize(d) -> OrderOut:
    return OrderOut(
        id=str(d["_id"]),
        userId=d["userId"],
        userEmail=d.get("userEmail"),
        productName=d["productName"],
        quantity=d["quantity"],
        shippingPrice=float(d["shippingPrice"]),
        totalPrice=float(d["totalPrice"]),
        createdAt=d["createdAt"],
    )

@app.get("/health")
async def health(): return {"ok": True, "service": "orders-ms2"}

@app.post("/orders", response_model=OrderOut, status_code=201)
async def create_order(
    payload: OrderCreate,
    user: dict = Depends(get_current_user),
    database = Depends(ensure_db),
):
    doc = {
        "userId": user["userId"],                 # = username del token
        "productName": payload.productName,
        "quantity": payload.quantity,
        "shippingPrice": float(payload.shippingPrice),
        "totalPrice": float(payload.quantity * payload.shippingPrice),
        "createdAt": datetime.utcnow(),
    }
    res = await database.orders.insert_one(doc)
    saved = await database.orders.find_one({"_id": res.inserted_id})
    return serialize(saved)

@app.get("/orders/me", response_model=List[OrderOut])
async def get_my_orders(
    user: dict = Depends(get_current_user),
    database = Depends(ensure_db),
):
    cursor = database.orders.find({"userId": user["userId"]}).sort("createdAt", -1)
    return [serialize(d) async for d in cursor]

@app.get("/orders/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: str,
    user: dict = Depends(get_current_user),
    database = Depends(ensure_db),
):
    try:
        oid = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="order_id inválido")
    d = await database.orders.find_one({"_id": oid, "userId": user["userId"]})
    if not d:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return serialize(d)
