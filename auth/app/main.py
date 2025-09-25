import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth as auth_routes
from app.grpc.grpc_server import build_grpc_server

ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "*").split(",")

app = FastAPI(title="Auth Service (HTTP + gRPC)")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS if ALLOW_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas HTTP
app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])

# Salud
@app.get("/health")
def health():
    return {"status": "ok"}

# gRPC servidor en background
@app.on_event("startup")
async def _start_grpc():
    server = build_grpc_server()
    server.start()
    app.state.grpc_server = server

@app.on_event("shutdown")
async def _stop_grpc():
    server = getattr(app.state, "grpc_server", None)
    if server:
        server.stop(grace=None)
