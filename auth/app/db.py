from pymongo import MongoClient
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongodb-auth:27017")
MONGO_DB  = os.getenv("MONGO_DB",  "auth_db")

_client = MongoClient(MONGO_URL)
_db = _client[MONGO_DB]

users_collection = _db["users"]

# índice único opcional (ignora error si ya existe)
try:
    users_collection.create_index("username", unique=True)
except Exception:
    pass
