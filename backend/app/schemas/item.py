from __future__ import annotations
import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel


class ItemBase(BaseModel):
    nivel: str
    tipo: str
    formato: str
    enunciado: str
    instruccion: str | None = None
    texto_base: str | None = None
    opciones: list[dict[str, Any]] | None = None
    respuesta_correcta: str | None = None
    dificultad: int | None = None
    constructo: str | None = None
    tiempo_segundos: int | None = None
    imagen_url: str | None = None
    imagen_opciones_url: str | None = None
    requiere_imagen: bool = False
    pagina_origen: int | None = None
    cuadernillo_origen: str | None = None


class ItemCreate(ItemBase):
    origen: str = "generado"
    confianza_generacion: float | None = None
    justificacion_generacion: str | None = None


class ItemUpdate(BaseModel):
    estado: str | None = None
    dificultad: int | None = None
    constructo: str | None = None
    enunciado: str | None = None
    opciones: list[dict[str, Any]] | None = None
    respuesta_correcta: str | None = None
    revisado_por: str | None = None


class ItemOut(ItemBase):
    id: uuid.UUID
    origen: str
    estado: str
    confianza_generacion: float | None = None
    justificacion_generacion: str | None = None
    creado_en: datetime
    revisado_en: datetime | None = None
    revisado_por: str | None = None

    model_config = {"from_attributes": True}


class GeneracionRequest(BaseModel):
    nivel: str
    tipo: str
    cantidad: int = 5
    dificultad_objetivo: int | None = None
    constructo: str | None = None
    instrucciones_extra: str | None = None


class GeneracionResponse(BaseModel):
    sesion_id: uuid.UUID
    items_generados: list[ItemOut]
    tokens_usados: int | None = None
    duracion_ms: int | None = None
    num_solicitados: int
    num_generados: int


class ItemListResponse(BaseModel):
    total: int
    items: list[ItemOut]
