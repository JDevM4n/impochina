import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
MONGO_DB = os.getenv("MONGO_DB", "warehouse_db")

client = MongoClient(MONGO_URL)
db = client[MONGO_DB]

app = FastAPI()

class OrderCreate(BaseModel):
    usuario: str
    producto: str
    cantidad: int

@app.post("/warehouse/create-order")
def create_order(order: OrderCreate):
    try:
        order_dict = order.dict()
        result = db.orders.insert_one(order_dict)
        return {"message": "Pedido creado", "id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
