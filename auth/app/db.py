from pymongo import MongoClient
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongodb-auth:27017")
client = MongoClient(MONGO_URL)
db = client["auth_db"]
users_collection = db["users"]
