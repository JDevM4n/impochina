# app/services/warehouse_service.py
from app.db.mongodb import db, serialize_doc
from typing import List
from bson.objectid import ObjectId

async def create_order_doc(doc: dict) -> dict:
    res = await db.pedidos.insert_one(doc)
    new = await db.pedidos.find_one({"_id": res.inserted_id})
    return serialize_doc(new)

async def get_orders_by_usuario(usuario: str) -> List[dict]:
    cursor = db.pedidos.find({"usuario": usuario})
    items = []
    async for d in cursor:
        items.append(serialize_doc(d))
    return items
