from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import MONGODB_URI, MONGO_DB_NAME

client = AsyncIOMotorClient(MONGODB_URI)
db = client[MONGO_DB_NAME]

def get_database():
    return db
