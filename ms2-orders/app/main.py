from typing import List
from bson import ObjectId
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.db import connect, disconnect, db, get_settings
from app.shemas import OrderCreate, OrderOut
from app.auth import get_current_user # ← absoluto


app = FastAPI(title="Orders MS (MS2)")

# CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.ALLOW_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await connect()

@app.on_event("shutdown")
async def shutdown():
    await disconnect()

def serialize(doc) -> OrderOut:
    return OrderOut(
        id=str(doc["_id"]),
        userId=doc["userId"],
        userEmail=doc.get("userEmail"),
        productName=doc["productName"],
        quantity=doc["quantity"],
        shippingPrice=float(doc["shippingPrice"]),
        totalPrice=float(doc["totalPrice"]),
        createdAt=doc["createdAt"],
    )

@app.get("/health")
async def health():
    return {"ok": True, "service": "orders-ms2"}

@app.post("/orders", response_model=OrderOut, status_code=201)
async def create_order(payload: OrderCreate, user=Depends(get_current_user)):
    """
    Crea un pedido.
    Calcula totalPrice = quantity * shippingPrice (placeholder).
    Cuando MS1 esté, puedes sumar el precio del producto si lo necesitas.
    """
    doc = {
        "userId": user["userId"],
        "userEmail": user.get("email"),
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
async def get_my_orders(user=Depends(get_current_user)):
    cursor = db.orders.find({"userId": user["userId"]}).sort("createdAt", -1)
    return [serialize(d) async for d in cursor]

@app.get("/orders/{order_id}", response_model=OrderOut)
async def get_order(order_id: str, user=Depends(get_current_user)):
    try:
        oid = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="order_id inválido")
    doc = await db.orders.find_one({"_id": oid, "userId": user["userId"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return serialize(doc)
