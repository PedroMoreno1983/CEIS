from __future__ import annotations
import uuid
from datetime import datetime
from pydantic import BaseModel
from .item import ItemOut


class AplicacionCreate(BaseModel):
    instrumento_id: uuid.UUID
    estudiante_nombre: str | None = None
    estudiante_curso: str | None = None
    estudiante_rut: str | None = None
    creado_por: str | None = None
    es_adaptativa: bool = False
    max_items: int | None = 30
    se_objetivo: float | None = 0.30


class AplicacionOut(BaseModel):
    id: uuid.UUID
    instrumento_id: uuid.UUID
    codigo: str
    estudiante_nombre: str | None = None
    estudiante_curso: str | None = None
    estudiante_rut: str | None = None
    estado: str
    iniciada_en: datetime | None = None
    finalizada_en: datetime | None = None
    tiempo_total_segundos: int | None = None
    puntaje_correctas: int | None = None
    puntaje_total: int | None = None
    creado_en: datetime
    es_adaptativa: bool = False
    theta_actual: float | None = None
    se_actual: float | None = None
    model_config = {"from_attributes": True}


class SiguienteItemResponse(BaseModel):
    item: dict | None = None     # ItemOut serializable o null si CAT terminó
    theta_actual: float
    se_actual: float
    n_respondidos: int
    motivo_termino: str | None = None  # 'se_alcanzado', 'max_items', 'sin_items'


class AplicacionParaResponder(BaseModel):
    """Datos que ve el estudiante al entrar con su código."""
    codigo: str
    estado: str
    instrumento_nombre: str
    instrumento_tipo: str
    instrumento_nivel: str
    instrucciones: str | None
    tiempo_minutos: int | None
    items: list[ItemOut]
    estudiante_nombre: str | None
    estudiante_curso: str | None
    respuestas_previas: dict[str, str]  # item_id -> respuesta


class RespuestaIn(BaseModel):
    item_id: uuid.UUID
    respuesta: str
    tiempo_segundos: int | None = None


class IdentidadEstudiante(BaseModel):
    estudiante_nombre: str
    estudiante_curso: str | None = None
    estudiante_rut: str | None = None


class ResultadosOut(BaseModel):
    aplicacion_id: uuid.UUID
    instrumento_nombre: str
    instrumento_tipo: str
    estudiante: dict[str, str | None]
    total_items: int
    items_respondidos: int
    correctas: int | None
    porcentaje: float | None
    tiempo_total_segundos: int | None
    por_constructo: list[dict] = []
    detalle: list[dict] = []
