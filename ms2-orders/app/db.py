from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings
from functools import lru_cache
import asyncio

class Settings(BaseSettings):
    MONGO_URL: str = "mongodb://localhost:27017"  # en Docker se sobreescribe a mongodb://mongo:27017
    MONGO_DB: str = "impochina_orders"
    AUTH_JWT_SECRET: str = "devsecret"
    AUTH_JWT_ALG: str = "HS256"
    ALLOW_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    PORT: int = 8000

    class Config:
        env_file = ".env"

@lru_cache
def get_settings():
    return Settings()

client: AsyncIOMotorClient | None = None
db = None

async def connect():
    """Conecta a Mongo con reintentos (evita crash si Mongo tarda)."""
    global client, db
    s = get_settings()
    wait = 0.5
    last = None
    for _ in range(20):  # ~1-2 min
        try:
            client = AsyncIOMotorClient(s.MONGO_URL, serverSelectionTimeoutMS=2000)
            await client.admin.command("ping")
            db = client[s.MONGO_DB]
            # índices básicos
            await db.orders.create_index("userId")
            await db.orders.create_index([("createdAt", -1)])
            return
        except Exception as e:
            last = e
            await asyncio.sleep(wait)
            wait = min(wait * 2, 5)
    raise RuntimeError(f"No se pudo conectar a Mongo: {last}")

async def ensure_db():
    """Devuelve la DB, conectando si hace falta (para inyectar en endpoints)."""
    global db
    if db is None:
        await connect()
    return db

async def disconnect():
    global client
    if client:
        client.close()
