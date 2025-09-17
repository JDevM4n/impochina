from app.db.mongodb import db, serialize_doc
from app.db.models import Pedido

async def guardar_pedido(pedido: Pedido):
    pedido_dict = pedido.dict()
    result = await db["pedidos"].insert_one(pedido_dict)
    pedido_dict["_id"] = result.inserted_id
    return serialize_doc(pedido_dict)

async def listar_pedidos():
    pedidos = []
    async for p in db["pedidos"].find():
        pedidos.append(serialize_doc(p))
    return pedidos
