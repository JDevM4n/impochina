from fastapi import APIRouter
from motor.motor_asyncio import AsyncIOMotorClient
import os

router = APIRouter()

# Conexión a MongoDB
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongodb:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.impochina_db
notifications_collection = db.notifications

# Crear notificación
@router.post("/")
async def create_notification(item: dict):
    result = await notifications_collection.insert_one(item)
    return {"inserted_id": str(result.inserted_id)}

# Leer notificaciones
@router.get("/")
async def read_notifications():
    docs = await notifications_collection.find().to_list(length=100)
    return docs
