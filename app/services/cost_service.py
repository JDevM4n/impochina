# app/services/cost_service.py
from app.core.config import SHIPPING_RATE_PER_KG, SHIPPING_MIN_FEE

def calculate_shipping_cost(total_weight_kg: float) -> float:
    cost = total_weight_kg * SHIPPING_RATE_PER_KG
    if cost < SHIPPING_MIN_FEE:
        cost = SHIPPING_MIN_FEE
    return round(cost, 2)
