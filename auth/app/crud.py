from auth.app.db import users_collection
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user(username):
    return users_collection.find_one({"username": username})

def create_user(user):
    hashed_password = pwd_context.hash(user["password"])
    user["password"] = hashed_password
    users_collection.insert_one(user)
    return {"username": user["username"], "email": user["email"]}

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)
