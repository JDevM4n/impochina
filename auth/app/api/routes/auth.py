# ... el resto de tu archivo se queda igual ...
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db import users_collection
from passlib.hash import bcrypt
import jwt
import os
import time  # <- nuevo

router = APIRouter()

SECRET_KEY = os.environ.get("SECRET_KEY", "mysecretkey")

class User(BaseModel):
    username: str
    password: str

@router.post("/register")
def register(user: User):
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="User already exists")
    hashed = bcrypt.hash(user.password)
    users_collection.insert_one({"username": user.username, "password": hashed})
    return {"message": "User registered successfully"}

@router.post("/login")
def login(user: User):
    db_user = users_collection.find_one({"username": user.username})
    if not db_user or not bcrypt.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # ⬇️ Cambios mínimos: exp + algorithm HS256
    payload = {
        "username": user.username,       # será nuestro "sub" lógico
        "exp": int(time.time()) + 8*3600 # expira en 8 horas
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return {"access_token": token}
