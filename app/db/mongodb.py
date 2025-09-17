from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "erpCompras"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Para serializar ObjectId
def serialize_doc(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc
