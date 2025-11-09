# En orders.py de ms2-orders
@router.get("/orders/me", response_model=list[OrderOut])
def list_my_orders(user_id: str = Depends(get_current_user)):
    try:
        db = get_db()
        from bson import ObjectId
        
        # Convertir string a ObjectId para consulta
        orders = list(db.orders.find({"userId": ObjectId(user_id)}).sort("createdAt", -1))
        
        for order in orders:
            order["id"] = str(order["_id"])
            order["userId"] = str(order["userId"])  # Convertir a string para response
            del order["_id"]
        
        return orders
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo órdenes: {str(e)}")

@router.post("/orders", response_model=OrderOut)
def create_order(body: OrderIn, user_id: str = Depends(get_current_user)):
    try:
        db = get_db()
        from bson import ObjectId
        
        total_price = (body.scrapedData.priceUSD * body.quantity if body.scrapedData and body.scrapedData.priceUSD else 0) + body.shippingPrice
        
        order_data = {
            "userId": ObjectId(user_id),  # Guardar como ObjectId
            "productName": body.productName,
            "quantity": body.quantity,
            "shippingPrice": body.shippingPrice,
            "totalPrice": total_price,
            "createdAt": datetime.utcnow(),
            "scrapedData": body.scrapedData.dict() if body.scrapedData else None
        }
        
        result = db.orders.insert_one(order_data)
        
        # Preparar response
        order_data["id"] = str(result.inserted_id)
        order_data["userId"] = user_id  # Mantener como string en response
        del order_data["_id"]
        
        return OrderOut(**order_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando orden: {str(e)}")