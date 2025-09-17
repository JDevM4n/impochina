from fastapi import APIRouter, HTTPException
from app.db.models import Pedido
from app.services import warehouse_service

router = APIRouter()

@router.post("/pedido")
async def crear_pedido(pedido: Pedido):
    nuevo = await warehouse_service.guardar_pedido(pedido)
    return {"message": "Pedido guardado", "pedido": nuevo}

@router.get("/pedidos")
async def obtener_pedidos():
    pedidos = await warehouse_service.listar_pedidos()
    return pedidos
