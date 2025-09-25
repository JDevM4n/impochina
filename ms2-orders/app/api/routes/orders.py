from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.db import get_db
from app.auth_dep import get_current_user

router = APIRouter()

class OrderIn(BaseModel):
    productName: str
    quantity: int
    shippingPrice: int

@router.get("/health")
def health():
    return {"ok": True}

@router.get("/orders/me")
def my_orders(user: str = Depends(get_current_user)):
    col = get_db()["orders"]
    docs = list(col.find({"username": user}, {"_id": 0}))
    return {"orders": docs}

@router.post("/orders")
def create_order(body: OrderIn, user: str = Depends(get_current_user)):
    col = get_db()["orders"]
    doc = {"username": user, **body.model_dump()}
    col.insert_one(doc)
    doc.pop("_id", None)
    return doc
