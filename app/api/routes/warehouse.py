from fastapi import APIRouter, Query
from app.models.order import Order
from app.db.mongo import orders_collection, order_serializer
from bson.objectid import ObjectId

router = APIRouter()

# Calcular costo del envío
@router.get("/calculate-shipping")
async def calculate_shipping(weight: float = Query(..., description="Peso en kg")):
    tarifa = 5  # USD por kilo
    price = weight * tarifa
    return {"price": price}

# Crear pedido en Mongo
@router.post("/create-order")
async def create_order(order: Order):
    pedido = order.dict()
    result = await orders_collection.insert_one(pedido)
    new_order = await orders_collection.find_one({"_id": result.inserted_id})
    return {"mensaje": "Pedido creado", "pedido": order_serializer(new_order)}

# Listar productos almacenados (pendientes de envío)
@router.get("/pending-orders/{usuario}")
async def get_pending_orders(usuario: str):
    pedidos = []
    cursor = orders_collection.find({"usuario": usuario, "estado": "pendiente"})
    async for pedido in cursor:
        pedidos.append(order_serializer(pedido))
    return {"pedidos": pedidos}
