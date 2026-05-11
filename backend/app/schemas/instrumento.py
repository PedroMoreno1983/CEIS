from __future__ import annotations
import uuid
from datetime import datetime
from pydantic import BaseModel
from .item import ItemOut


class InstrumentoBase(BaseModel):
    nombre: str
    nivel: str
    tipo: str
    descripcion: str | None = None
    instrucciones: str | None = None
    tiempo_minutos: int | None = None


class InstrumentoCreate(InstrumentoBase):
    item_ids: list[uuid.UUID]
    creado_por: str | None = None


class InstrumentoOut(InstrumentoBase):
    id: uuid.UUID
    num_items: int | None = None
    estado: str
    creado_en: datetime
    creado_por: str | None = None
    items: list[ItemOut] = []

    model_config = {"from_attributes": True}
