"""Schemas Pydantic del libro de clases."""
from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

TipoPeriodo = Literal["semestral", "trimestral", "cuatrimestral", "anual"]
EstadoAsistencia = Literal["presente", "ausente", "atrasado", "justificado", "retirado"]
TipoAnotacion = Literal["positiva", "negativa", "neutra"]


# ------------------------------------------------------------
# Asignatura
# ------------------------------------------------------------

class AsignaturaBase(BaseModel):
    colegio_id: uuid.UUID
    codigo: str = Field(..., min_length=1, max_length=20)
    nombre: str = Field(..., min_length=2, max_length=200)
    categoria: str | None = None
    color: str | None = None


class AsignaturaCreate(AsignaturaBase):
    pass


class AsignaturaUpdate(BaseModel):
    codigo: str | None = None
    nombre: str | None = None
    categoria: str | None = None
    color: str | None = None


class AsignaturaOut(AsignaturaBase):
    id: uuid.UUID
    creado_en: datetime
    actualizado_en: datetime
    model_config = {"from_attributes": True}


# ------------------------------------------------------------
# Carga académica (curso ↔ asignatura ↔ docente)
# ------------------------------------------------------------

class CargaCreate(BaseModel):
    curso_id: uuid.UUID
    asignatura_id: uuid.UUID
    docente_id: uuid.UUID
    horas_semanales: int | None = None


class CargaOut(BaseModel):
    id: uuid.UUID
    curso_id: uuid.UUID
    asignatura_id: uuid.UUID
    docente_id: uuid.UUID
    horas_semanales: int | None
    creado_en: datetime
    # Enriquecido
    asignatura_codigo: str | None = None
    asignatura_nombre: str | None = None
    docente_nombre: str | None = None
    model_config = {"from_attributes": True}


# ------------------------------------------------------------
# Periodo
# ------------------------------------------------------------

class PeriodoBase(BaseModel):
    colegio_id: uuid.UUID
    ano: int = Field(..., ge=2000, le=2100)
    tipo: TipoPeriodo = "semestral"
    numero: int = Field(..., ge=1, le=4)
    nombre: str
    fecha_inicio: date
    fecha_termino: date
    activo: bool = True


class PeriodoCreate(PeriodoBase):
    pass


class PeriodoUpdate(BaseModel):
    ano: int | None = Field(default=None, ge=2000, le=2100)
    tipo: TipoPeriodo | None = None
    numero: int | None = Field(default=None, ge=1, le=4)
    nombre: str | None = None
    fecha_inicio: date | None = None
    fecha_termino: date | None = None
    activo: bool | None = None


class PeriodoOut(PeriodoBase):
    id: uuid.UUID
    creado_en: datetime
    actualizado_en: datetime
    model_config = {"from_attributes": True}


# ------------------------------------------------------------
# Calificacion
# ------------------------------------------------------------

class CalificacionBase(BaseModel):
    estudiante_id: uuid.UUID
    asignatura_id: uuid.UUID
    periodo_id: uuid.UUID
    docente_id: uuid.UUID | None = None
    nota: Decimal | None = Field(default=None, ge=1.0, le=7.0)
    ponderacion: int = Field(default=100, ge=1, le=1000)
    tipo: str | None = None
    descripcion: str = Field(..., min_length=1, max_length=300)
    fecha: date


class CalificacionCreate(CalificacionBase):
    pass


class CalificacionUpdate(BaseModel):
    nota: Decimal | None = Field(default=None, ge=1.0, le=7.0)
    ponderacion: int | None = Field(default=None, ge=1, le=1000)
    tipo: str | None = None
    descripcion: str | None = None
    fecha: date | None = None


class CalificacionOut(CalificacionBase):
    id: uuid.UUID
    creado_en: datetime
    actualizado_en: datetime
    # Enriquecido
    estudiante_nombre: str | None = None
    asignatura_codigo: str | None = None
    model_config = {"from_attributes": True}


class CalificacionBulkItem(BaseModel):
    """Una fila del batch para registrar la misma evaluación a varios estudiantes."""
    estudiante_id: uuid.UUID
    nota: Decimal | None = Field(default=None, ge=1.0, le=7.0)


class CalificacionBulkCreate(BaseModel):
    """Crea una evaluación común (descripción, fecha, ponderación) para varios estudiantes."""
    asignatura_id: uuid.UUID
    periodo_id: uuid.UUID
    docente_id: uuid.UUID | None = None
    descripcion: str = Field(..., min_length=1, max_length=300)
    fecha: date
    ponderacion: int = Field(default=100, ge=1, le=1000)
    tipo: str | None = None
    notas: list[CalificacionBulkItem]


# ------------------------------------------------------------
# Asistencia
# ------------------------------------------------------------

class AsistenciaItem(BaseModel):
    estudiante_id: uuid.UUID
    estado: EstadoAsistencia
    observacion: str | None = None


class AsistenciaCursoFecha(BaseModel):
    """Registra/actualiza asistencia de todo un curso en una fecha."""
    curso_id: uuid.UUID
    fecha: date
    registros: list[AsistenciaItem]
    registrada_por_id: uuid.UUID | None = None


class AsistenciaOut(BaseModel):
    id: uuid.UUID
    estudiante_id: uuid.UUID
    curso_id: uuid.UUID
    fecha: date
    estado: EstadoAsistencia
    observacion: str | None
    registrada_por_id: uuid.UUID | None
    creado_en: datetime
    actualizado_en: datetime
    # Enriquecido
    estudiante_nombre: str | None = None
    model_config = {"from_attributes": True}


class AsistenciaResumen(BaseModel):
    """Estadísticas agregadas para un estudiante en un período."""
    estudiante_id: uuid.UUID
    total_dias: int
    presentes: int
    ausentes: int
    atrasados: int
    justificados: int
    porcentaje_asistencia: float | None  # 0-100


# ------------------------------------------------------------
# Anotacion
# ------------------------------------------------------------

class AnotacionBase(BaseModel):
    estudiante_id: uuid.UUID
    docente_id: uuid.UUID | None = None
    asignatura_id: uuid.UUID | None = None
    fecha: date
    tipo: TipoAnotacion = "neutra"
    categoria: str | None = None
    descripcion: str = Field(..., min_length=1, max_length=2000)


class AnotacionCreate(AnotacionBase):
    pass


class AnotacionUpdate(BaseModel):
    asignatura_id: uuid.UUID | None = None
    fecha: date | None = None
    tipo: TipoAnotacion | None = None
    categoria: str | None = None
    descripcion: str | None = None


class AnotacionOut(AnotacionBase):
    id: uuid.UUID
    creado_en: datetime
    # Enriquecido
    estudiante_nombre: str | None = None
    docente_nombre: str | None = None
    asignatura_nombre: str | None = None
    model_config = {"from_attributes": True}
