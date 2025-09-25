# app/main.py
from fastapi import FastAPI
from app.api.routes.orders import router as orders_router
from app.db import connect, disconnect

app = FastAPI()

@app.on_event("startup")
def _startup():
    connect()          # <- sin await

@app.on_event("shutdown")
def _shutdown():
    disconnect()       # <- sin await

app.include_router(orders_router)
