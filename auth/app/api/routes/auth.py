from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db import users_collection
from passlib.hash import bcrypt
import jwt
import os
import time

router = APIRouter()

SECRET_KEY = os.environ.get("SECRET_KEY", "mysecretkey")
JWT_ALG    = os.environ.get("JWT_ALG", "HS256")

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

    payload = {
        "username": user.username,
        "exp": int(time.time()) + 8 * 3600  # 8 horas
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALG)
    return {"access_token": token}
