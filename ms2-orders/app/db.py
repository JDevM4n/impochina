from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    MONGO_URL: str = "mongodb://localhost:27017"
    MONGO_DB: str = "impochina_orders"

    AUTH_JWT_SECRET: str = "devsecret"
    AUTH_JWT_ALG: str = "HS256"

    ALLOW_ORIGINS: str = "http://localhost:3000"
    PORT: int = 8000

    class Config:
        env_file = ".env"

@lru_cache
def get_settings():
    return Settings()

client: AsyncIOMotorClient | None = None
db = None

async def connect():
    global client, db
    settings = get_settings()
    client = AsyncIOMotorClient(settings.MONGO_URL)
    db = client[settings.MONGO_DB]
    # Índices útiles
    await db.orders.create_index("userId")
    await db.orders.create_index([("createdAt", -1)])

async def disconnect():
    global client
    if client:
        client.close()
