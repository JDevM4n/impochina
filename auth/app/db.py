from pymongo import MongoClient
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongodb-auth:27017")  # tu contenedor de Mongo
client = MongoClient(MONGO_URL)
db = client["auth_db"]  # coincide con tu base de datos
users_collection = db["users"]  # coincide con tu colección
