from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth  # importa tu auth.py

app = FastAPI(title="Microservicio Auth")

# Configurar CORS
origins = ["*"]  # Temporalmente cualquier frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
