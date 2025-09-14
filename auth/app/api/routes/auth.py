# auth_service/app/api/routes/auth.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db import users_collection
from passlib.hash import bcrypt
import jwt
import os

router = APIRouter()

SECRET_KEY = os.environ.get("SECRET_KEY", "mysecretkey")

class User(BaseModel):
    username: str
    password: str

# Registro
@router.post("/register")
def register(user: User):
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="User already exists")
    hashed = bcrypt.hash(user.password)
    users_collection.insert_one({"username": user.username, "password": hashed})
    return {"message": "User registered successfully"}

# Login
@router.post("/login")
def login(user: User):
    db_user = users_collection.find_one({"username": user.username})
    if not db_user or not bcrypt.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = jwt.encode({"username": user.username}, SECRET_KEY)
    return {"access_token": token}
