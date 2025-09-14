from pymongo import MongoClient
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongodb-products:27017")
client = MongoClient(MONGO_URL)
db = client["imporchina_products"]
products_collection = db["products"]
