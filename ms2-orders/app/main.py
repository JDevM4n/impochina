"""Aplicación FastAPI para ms2-orders."""
from typing import List, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from app.api.routes.orders import router as orders_router
from app.db import connect, disconnect

# Catálogo de tags globales (aparece en OpenAPI -> "tags")
TAGS_METADATA: List[Dict[str, str]] = [
    {"name": "health", "description": "Endpoints de salud/monitor."},
    {"name": "orders", "description": "Gestión de órdenes del usuario."},
]

app = FastAPI(
    title="Impochina - ms2-orders",
    version="1.0.0",
    description="Microservicio de órdenes (creación, consulta y salud).",
    contact={"name": "Equipo Impochina", "email": "soporte@impochina.local"},
    openapi_tags=TAGS_METADATA,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Personalizar OpenAPI para incluir servers, tags y contacto
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    # Servidores válidos
    schema["servers"] = [{"url": "http://localhost:8000"}]
    # Contacto obligatorio
    schema.setdefault("info", {})
    schema["info"]["contact"] = {
        "name": "Equipo Impochina",
        "email": "soporte@impochina.local",
        "url": "http://localhost:8000/docs",
    }
    # Tags globales
    schema["tags"] = TAGS_METADATA
    app.openapi_schema = schema
    return app.openapi_schema

app.openapi = custom_openapi  # type: ignore[assignment]

@app.on_event("startup")
def _startup() -> None:
    connect()

@app.on_event("shutdown")
def _shutdown() -> None:
    disconnect()

@app.get(
    "/health",
    tags=["health"],
    description="Verifica el estado del servicio (ping)."
)
def health():
    return {"status": "ok"}

# Todas las rutas de órdenes heredan tag "orders"
app.include_router(orders_router, tags=["orders"])
