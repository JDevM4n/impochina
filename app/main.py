# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import warehouse, notifications  # notifications si lo tienes

app = FastAPI(title="Microservice 2 - Impochina")

# CORS: permite al front (localhost) conectarse. En producción restringe.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(warehouse.router, prefix="/warehouse", tags=["Warehouse"])

@app.get("/")
def root():
    return {"message": "Microservice 2 is running 🚀"}
