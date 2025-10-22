"""Conexión a MongoDB para ms2-orders (singleton sin globals)."""
from functools import lru_cache
import os
from typing import Final

from pymongo import MongoClient

MONGO_URL: Final[str] = os.getenv("MONGO_URL", "mongodb://mongo:27017")
MONGO_DB: Final[str] = os.getenv("MONGO_DB", "impochina_orders")


@lru_cache(maxsize=1)
def _client() -> MongoClient:
    """Crea/retorna un MongoClient cacheado."""
    return MongoClient(MONGO_URL)


def connect() -> None:
    """Inicia la conexión (precalienta el cliente)."""
    _client()


def disconnect() -> None:
    """Cierra la conexión y limpia la caché."""
    _client().close()
    _client.cache_clear()  # type: ignore[attr-defined]


def get_db():
    """Devuelve la base de datos configurada."""
    return _client()[MONGO_DB]
