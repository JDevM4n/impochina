"""Rutas de órdenes."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.auth_dep import get_current_user

router = APIRouter()

class OrderIn(BaseModel):
    item: str
    qty: int

class OrderOut(BaseModel):
    id: str
    item: str
    qty: int

@router.get(
    "/orders/me",
    response_model=list[OrderOut],
    description="Lista las órdenes del usuario autenticado."
)
def list_my_orders(user: str = Depends(get_current_user)):
    return [OrderOut(id="1", item="demo", qty=1)]

@router.post(
    "/orders",
    response_model=OrderOut,
    description="Crea una nueva orden para el usuario autenticado."
)
def create_order(body: OrderIn, user: str = Depends(get_current_user)):
    return OrderOut(id="2", item=body.item, qty=body.qty)
