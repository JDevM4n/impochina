# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import notifications, warehouse

app = FastAPI(title="Microservice 2 - Impochina")

# CORS (permite a tu frontend correr en otro puerto)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # en prod limita a tu dominio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(warehouse.router, prefix="/warehouse", tags=["Warehouse"])

@app.get("/")
def root():
    return {"message": "Microservice 2 is running in Docker 🚀"}
