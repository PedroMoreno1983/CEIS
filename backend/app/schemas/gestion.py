"""Schemas Pydantic para el módulo de gestión escolar."""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


# ------------------------------------------------------------
# Tipos literales (mismos valores que los enums en gestion.*)
# ------------------------------------------------------------

NivelCurso = Literal[
    "nt1", "nt2",
    "1_basico", "2_basico", "3_basico", "4_basico",
    "5_basico", "6_basico", "7_basico", "8_basico",
    "1_medio", "2_medio", "3_medio", "4_medio",
]

Dependencia = Literal[
    "municipal",
    "particular_subvencionado",
    "particular_pagado",
    "corporacion_municipal",
    "servicio_local_educacion",
    "administracion_delegada",
]

EstadoEstudiante = Literal["activo", "retirado", "egresado", "congelado"]
Genero = Literal["masculino", "femenino", "otro", "sin_informar"]
EstadoPersona = Literal["activo", "inactivo"]
RolDocente = Literal[
    "docente",
    "profesor_jefe",
    "orientador",
    "ute",
    "inspector",
    "direccion",
    "admin_colegio",
    "psicologo",
]


# ------------------------------------------------------------
# Colegio
# ------------------------------------------------------------

class ColegioBase(BaseModel):
    rbd: str | None = None
    nombre: str = Field(..., min_length=2, max_length=200)
    razon_social: str | None = None
    rut: str | None = None
    dependencia: Dependencia | None = None
    direccion: str | None = None
    comuna: str | None = None
    region: str | None = None
    telefono: str | None = None
    email: str | None = None
    sitio_web: str | None = None
    logo_url: str | None = None
    estado: EstadoPersona = "activo"


class ColegioCreate(ColegioBase):
    pass


class ColegioUpdate(BaseModel):
    rbd: str | None = None
    nombre: str | None = None
    razon_social: str | None = None
    rut: str | None = None
    dependencia: Dependencia | None = None
    direccion: str | None = None
    comuna: str | None = None
    region: str | None = None
    telefono: str | None = None
    email: str | None = None
    sitio_web: str | None = None
    logo_url: str | None = None
    estado: EstadoPersona | None = None


class ColegioOut(ColegioBase):
    id: uuid.UUID
    creado_en: datetime
    actualizado_en: datetime
    model_config = {"from_attributes": True}


# ------------------------------------------------------------
# Docente
# ------------------------------------------------------------

class DocenteBase(BaseModel):
    colegio_id: uuid.UUID
    rut: str | None = None
    nombres: str = Field(..., min_length=1, max_length=200)
    apellido_paterno: str = Field(..., min_length=1, max_length=200)
    apellido_materno: str | None = None
    email: str | None = None
    telefono: str | None = None
    roles: list[RolDocente] = Field(default_factory=lambda: ["docente"])
    estado: EstadoPersona = "activo"


class DocenteCreate(DocenteBase):
    pass


class DocenteUpdate(BaseModel):
    rut: str | None = None
    nombres: str | None = None
    apellido_paterno: str | None = None
    apellido_materno: str | None = None
    email: str | None = None
    telefono: str | None = None
    roles: list[RolDocente] | None = None
    estado: EstadoPersona | None = None


class DocenteOut(DocenteBase):
    id: uuid.UUID
    creado_en: datetime
    actualizado_en: datetime
    model_config = {"from_attributes": True}


# ------------------------------------------------------------
# Curso
# ------------------------------------------------------------

class CursoBase(BaseModel):
    colegio_id: uuid.UUID
    ano: int = Field(..., ge=2000, le=2100)
    nivel: NivelCurso
    letra: str = Field(..., min_length=1, max_length=4)
    profesor_jefe_id: uuid.UUID | None = None


class CursoCreate(CursoBase):
    pass


class CursoUpdate(BaseModel):
    ano: int | None = Field(default=None, ge=2000, le=2100)
    nivel: NivelCurso | None = None
    letra: str | None = None
    profesor_jefe_id: uuid.UUID | None = None


class CursoOut(CursoBase):
    id: uuid.UUID
    creado_en: datetime
    actualizado_en: datetime
    # Campos enriquecidos opcionales
    profesor_jefe_nombre: str | None = None
    num_estudiantes: int | None = None
    model_config = {"from_attributes": True}


# ------------------------------------------------------------
# Estudiante
# ------------------------------------------------------------

class EstudianteBase(BaseModel):
    colegio_id: uuid.UUID
    rut: str = Field(..., min_length=3, max_length=20)
    nombres: str = Field(..., min_length=1, max_length=200)
    apellido_paterno: str = Field(..., min_length=1, max_length=200)
    apellido_materno: str | None = None
    fecha_nacimiento: date | None = None
    genero: Genero | None = None
    direccion: str | None = None
    comuna: str | None = None
    email_personal: str | None = None
    estado: EstadoEstudiante = "activo"
    fecha_ingreso: date | None = None
    fecha_retiro: date | None = None
    observaciones: str | None = None


class EstudianteCreate(EstudianteBase):
    # Opcional: vincular a un curso al crear
    curso_id: uuid.UUID | None = None
    numero_lista: int | None = None


class EstudianteUpdate(BaseModel):
    rut: str | None = None
    nombres: str | None = None
    apellido_paterno: str | None = None
    apellido_materno: str | None = None
    fecha_nacimiento: date | None = None
    genero: Genero | None = None
    direccion: str | None = None
    comuna: str | None = None
    email_personal: str | None = None
    estado: EstadoEstudiante | None = None
    fecha_ingreso: date | None = None
    fecha_retiro: date | None = None
    observaciones: str | None = None


class EstudianteOut(EstudianteBase):
    id: uuid.UUID
    creado_en: datetime
    actualizado_en: datetime
    # Campos enriquecidos opcionales
    curso_actual_id: uuid.UUID | None = None
    curso_actual_label: str | None = None
    model_config = {"from_attributes": True}


# ------------------------------------------------------------
# Estudiante ↔ Curso (matrícula)
# ------------------------------------------------------------

class EstudianteCursoCreate(BaseModel):
    estudiante_id: uuid.UUID
    curso_id: uuid.UUID
    fecha_inicio: date | None = None
    numero_lista: int | None = None


class EstudianteCursoOut(BaseModel):
    id: uuid.UUID
    estudiante_id: uuid.UUID
    curso_id: uuid.UUID
    fecha_inicio: date
    fecha_termino: date | None
    numero_lista: int | None
    activo: bool
    creado_en: datetime
    model_config = {"from_attributes": True}


# ------------------------------------------------------------
# Apoderado
# ------------------------------------------------------------

TipoApoderado = Literal[
    "padre", "madre", "tutor_legal", "abuelo", "abuela", "tio", "tia", "otro"
]

class ApoderadoBase(BaseModel):
    colegio_id: uuid.UUID
    rut: str | None = None
    nombres: str = Field(..., min_length=1, max_length=200)
    apellido_paterno: str = Field(..., min_length=1, max_length=200)
    apellido_materno: str | None = None
    email: str | None = None
    telefono: str | None = None
    telefono_alt: str | None = None
    profesion: str | None = None
    direccion: str | None = None
    comuna: str | None = None
    estado: EstadoPersona = "activo"


class ApoderadoCreate(ApoderadoBase):
    pass


class ApoderadoUpdate(BaseModel):
    colegio_id: uuid.UUID | None = None
    rut: str | None = None
    nombres: str | None = None
    apellido_paterno: str | None = None
    apellido_materno: str | None = None
    email: str | None = None
    telefono: str | None = None
    telefono_alt: str | None = None
    profesion: str | None = None
    direccion: str | None = None
    comuna: str | None = None
    estado: EstadoPersona | None = None


class ApoderadoOut(ApoderadoBase):
    id: uuid.UUID
    creado_en: datetime
    actualizado_en: datetime
    model_config = {"from_attributes": True}


class EstudianteApoderadoCreate(BaseModel):
    estudiante_id: uuid.UUID
    apoderado_id: uuid.UUID
    tipo: TipoApoderado = "otro"
    es_principal: bool = False
    vive_con: bool = False
    retira_estudiante: bool = True
    observaciones: str | None = None


class EstudianteApoderadoOut(EstudianteApoderadoCreate):
    id: uuid.UUID
    creado_en: datetime
    model_config = {"from_attributes": True}


# ------------------------------------------------------------
# Mensajes
# ------------------------------------------------------------

TipoMensaje = Literal["individual", "curso", "general"]

class MensajeBase(BaseModel):
    colegio_id: uuid.UUID
    autor_docente_id: uuid.UUID | None = None
    tipo: TipoMensaje = "individual"
    asunto: str = Field(..., min_length=1, max_length=300)
    contenido: str = Field(..., min_length=1)
    importante: bool = False
    curso_id: uuid.UUID | None = None


class MensajeCreate(MensajeBase):
    # Lista de apoderados destinatarios (solo para tipo=individual)
    destinatarios: list[uuid.UUID] | None = None


class MensajeUpdate(BaseModel):
    asunto: str | None = None
    contenido: str | None = None
    importante: bool | None = None


class MensajeDestinatarioOut(BaseModel):
    id: uuid.UUID
    mensaje_id: uuid.UUID
    apoderado_id: uuid.UUID
    estudiante_id: uuid.UUID | None = None
    leido_en: datetime | None = None
    creado_en: datetime
    model_config = {"from_attributes": True}


class MensajeOut(MensajeBase):
    id: uuid.UUID
    creado_en: datetime
    # Campos enriquecidos
    autor_nombre: str | None = None
    num_destinatarios: int | None = None
    num_leidos: int | None = None
    model_config = {"from_attributes": True}


# ------------------------------------------------------------
# Plan de mejora
# ------------------------------------------------------------

EstadoPlan = Literal["borrador", "activo", "logrado", "no_logrado", "cerrado"]
PrioridadObjetivo = Literal["alta", "media", "baja"]
EstadoObjetivo = Literal["pendiente", "en_curso", "logrado", "no_logrado"]

class PlanMejoraBase(BaseModel):
    estudiante_id: uuid.UUID
    autor_docente_id: uuid.UUID | None = None
    titulo: str = Field(..., min_length=1, max_length=300)
    descripcion: str | None = None
    estado: EstadoPlan = "borrador"
    fecha_inicio: date
    fecha_termino_estim: date | None = None
    fecha_termino_real: date | None = None


class PlanMejoraCreate(PlanMejoraBase):
    pass


class PlanMejoraUpdate(BaseModel):
    titulo: str | None = None
    descripcion: str | None = None
    estado: EstadoPlan | None = None
    fecha_inicio: date | None = None
    fecha_termino_estim: date | None = None
    fecha_termino_real: date | None = None


class PlanMejoraOut(PlanMejoraBase):
    id: uuid.UUID
    creado_en: datetime
    actualizado_en: datetime
    # Enriquecidos
    estudiante_nombre: str | None = None
    autor_nombre: str | None = None
    num_objetivos: int | None = None
    model_config = {"from_attributes": True}


class ObjetivoPlanBase(BaseModel):
    plan_id: uuid.UUID
    descripcion: str = Field(..., min_length=1)
    prioridad: PrioridadObjetivo = "media"
    estado: EstadoObjetivo = "pendiente"
    fecha_objetivo: date | None = None


class ObjetivoPlanCreate(ObjetivoPlanBase):
    pass


class ObjetivoPlanUpdate(BaseModel):
    descripcion: str | None = None
    prioridad: PrioridadObjetivo | None = None
    estado: EstadoObjetivo | None = None
    fecha_objetivo: date | None = None


class ObjetivoPlanOut(ObjetivoPlanBase):
    id: uuid.UUID
    creado_en: datetime
    actualizado_en: datetime
    model_config = {"from_attributes": True}


class SeguimientoPlanBase(BaseModel):
    plan_id: uuid.UUID
    fecha: date
    autor_docente_id: uuid.UUID | None = None
    descripcion: str = Field(..., min_length=1)


class SeguimientoPlanCreate(SeguimientoPlanBase):
    pass


class SeguimientoPlanOut(SeguimientoPlanBase):
    id: uuid.UUID
    creado_en: datetime
    # Enriquecido
    autor_nombre: str | None = None
    model_config = {"from_attributes": True}


# ------------------------------------------------------------
# PIE
# ------------------------------------------------------------

TipoPie = Literal["permanente", "transitorio"]
EstadoPie = Literal["activo", "egresado", "derivado", "cerrado"]

class PIEDiagnosticoBase(BaseModel):
    estudiante_id: uuid.UUID
    tipo: TipoPie
    diagnostico: str = Field(..., min_length=1)
    fecha_diagnostico: date
    profesional_responsable: str | None = None
    estado: EstadoPie = "activo"
    fecha_ingreso_pie: date | None = None
    fecha_egreso_pie: date | None = None
    observaciones: str | None = None


class PIEDiagnosticoCreate(PIEDiagnosticoBase):
    pass


class PIEDiagnosticoUpdate(BaseModel):
    tipo: TipoPie | None = None
    diagnostico: str | None = None
    fecha_diagnostico: date | None = None
    profesional_responsable: str | None = None
    estado: EstadoPie | None = None
    fecha_ingreso_pie: date | None = None
    fecha_egreso_pie: date | None = None
    observaciones: str | None = None


class PIEDiagnosticoOut(PIEDiagnosticoBase):
    id: uuid.UUID
    creado_en: datetime
    actualizado_en: datetime
    # Enriquecido
    estudiante_nombre: str | None = None
    num_intervenciones: int | None = None
    model_config = {"from_attributes": True}


class PIEIntervencionBase(BaseModel):
    diagnostico_id: uuid.UUID
    fecha: date
    profesional: str = Field(..., min_length=1)
    duracion_minutos: int | None = Field(default=None, ge=1)
    descripcion: str = Field(..., min_length=1)
    observaciones: str | None = None


class PIEIntervencionCreate(PIEIntervencionBase):
    pass


class PIEIntervencionOut(PIEIntervencionBase):
    id: uuid.UUID
    creado_en: datetime
    model_config = {"from_attributes": True}
