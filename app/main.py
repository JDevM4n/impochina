from fastapi import FastAPI
from app.api.routes import notifications, warehouse

app = FastAPI(title="Microservice 2 - Impochina")

# Rutas
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(warehouse.router, prefix="/warehouse", tags=["Warehouse"])

@app.get("/")
def root():
    return {"message": "Microservice 2 is running in Docker 🚀"}
