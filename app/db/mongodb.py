# app/db/mongodb.py
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DB", "erpCompras")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

def serialize_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc
