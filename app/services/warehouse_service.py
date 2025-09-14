from app.db.mongodb import db
from app.schemas.qc_item import QCITEM

async def create_qc_item(item: QCITEM):
    result = await db.qc_items.insert_one(item.dict())
    return str(result.inserted_id)

async def list_qc_items():
    items = await db.qc_items.find().to_list(100)
    return items
