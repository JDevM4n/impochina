import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")  # en Docker lo sobreescribimos a mongodb://orders-mongo:27017
MONGO_DB  = os.getenv("MONGO_DB",  "impochina_orders")

_client: AsyncIOMotorClient | None = None
_db = None

async def connect():
    global _client, _db
    last = None
    delay = 0.5
    for _ in range(20):
        try:
            _client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=2000)
            await _client.admin.command("ping")
            _db = _client[MONGO_DB]
            await _db.orders.create_index("userId")
            await _db.orders.create_index([("createdAt", -1)])
            return
        except Exception as e:
            last = e
            await asyncio.sleep(delay)
            delay = min(delay * 2, 5)
    raise RuntimeError(f"No se pudo conectar a Mongo: {last}")

async def ensure_db():
    global _db
    if _db is None:
        await connect()
    return _db

async def disconnect():
    global _client
    if _client:
        _client.close()
