# app/core/config.py
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "impochina_db")
MICROSERVICE1_URL = os.getenv("MICROSERVICE1_URL", "http://microservice1:8000")
AUTH_INTROSPECTION_URL = os.getenv("AUTH_INTROSPECTION_URL", "")
JWT_PUBLIC_KEY = os.getenv("JWT_PUBLIC_KEY", "")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "RS256")

SHIPPING_RATE_PER_KG = float(os.getenv("SHIPPING_RATE_PER_KG", "5.0"))
SHIPPING_MIN_FEE = float(os.getenv("SHIPPING_MIN_FEE", "2.0"))
