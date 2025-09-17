from motor.motor_asyncio import AsyncIOMotorClient
from bson.objectid import ObjectId

MONGO_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client.impochina_db
orders_collection = db.orders

def order_serializer(order) -> dict:
    return {
        "id": str(order["_id"]),
        "usuario": order["usuario"],
        "producto": order["producto"],
        "direccion": order["direccion"],
        "imagen": order["imagen"],
        "peso": order["peso"],
        "costo_envio": order["costo_envio"],
        "estado": order.get("estado", "pendiente")
    }

