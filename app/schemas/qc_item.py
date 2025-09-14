from pydantic import BaseModel

class QCITEM(BaseModel):
    id: int
    name: str
    description: str | None = None
