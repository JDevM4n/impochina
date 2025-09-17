# app/services/warehouse_service.py
from app.db.mongodb import db
from datetime import datetime
from bson import ObjectId

async def create_order_doc(doc: dict) -> str:
    doc.setdefault("status", "pendiente")
    doc.setdefault("total_weight_kg", sum(p.get("weight_kg",0)*p.get("quantity",1) for p in doc.get("products", [])))
    doc.setdefault("shipping_cost", None)
    doc.setdefault("delivery_option", None)
    doc.setdefault("invoice_ready", False)
    doc.setdefault("photos", [])
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    res = await db.orders.insert_one(doc)
    return str(res.inserted_id)

async def get_orders_by_user(user_id: str, status: str = None):
    q = {"user_id": user_id}
    if status:
        q["status"] = status
    cursor = db.orders.find(q).sort("created_at", -1)
    items = await cursor.to_list(length=100)
    for d in items:
        d["id"] = str(d["_id"]); d.pop("_id", None)
    return items

async def get_order_by_id(order_id: str):
    try:
        doc = await db.orders.find_one({"_id": ObjectId(order_id)})
    except Exception:
        return None
    if not doc: return None
    doc["id"] = str(doc["_id"]); doc.pop("_id", None)
    return doc

async def update_order(order_id: str, changes: dict):
    from datetime import datetime
    try:
        res = await db.orders.update_one({"_id": ObjectId(order_id)}, {"$set": {**changes, "updated_at": datetime.utcnow()}})
    except Exception:
        return None
    return await get_order_by_id(order_id)
