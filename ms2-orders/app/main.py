from typing import List
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId

from app.db import connect, disconnect, ensure_db, get_settings
from app.schemas import OrderCreate, OrderOut
from app.auth import get_current_user

app = FastAPI(title="Orders MS (MS2)")
settings = get_settings()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.ALLOW_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await connect()

@app.on_event("shutdown")
async def on_shutdown():
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
async def create_order(
    payload: OrderCreate,
    user: dict = Depends(get_current_user),
    database = Depends(ensure_db),
):
    doc = {
        "userId": user["userId"],
        "userEmail": user.get("email"),
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

    doc = await database.orders.find_one({"_id": oid, "userId": user["userId"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return serialize(doc)

# --- Endpoints de debug (opcionales) ---
# from fastapi import Depends
# @app.get("/debug/db-info")
# async def db_info(database = Depends(ensure_db)):
#     count = await database.orders.count_documents({})
#     last = []
#     async for d in database.orders.find().sort("createdAt", -1).limit(5):
#         d["_id"] = str(d["_id"])
#         last.append(d)
#     return {"mongo_url": settings.MONGO_URL, "mongo_db": settings.MONGO_DB, "count": count, "last5": last}
