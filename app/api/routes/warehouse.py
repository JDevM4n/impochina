from fastapi import APIRouter
from app.schemas.qc_item import QCITEM
from app.services.warehouse_service import create_qc_item, list_qc_items

router = APIRouter()

@router.get("/items")
def get_items():
    return list_qc_items()

@router.post("/items")
def add_item(item: QCITEM):
    return create_qc_item(item)
