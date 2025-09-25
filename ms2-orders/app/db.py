# app/db.py
import os
from pymongo import MongoClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
MONGO_DB  = os.getenv("MONGO_DB", "impochina_orders")

_client = None
_db = None

def connect():
    global _client, _db
    if _client is None:
        _client = MongoClient(MONGO_URL)
        _db = _client[MONGO_DB]

def disconnect():
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None

def get_db():
    global _db
    if _db is None:
        connect()
    return _db
