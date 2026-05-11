"""Modelos SQLAlchemy del schema `gestion` — cimientos de gestión escolar.

Schema separado del default para mantener un límite claro entre
"evaluación e instrumentos" (default) y "gestión escolar" (gestion).
"""
import uuid
from datetime import date, datetime
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    ForeignKey,
    SmallInteger,
    TIMESTAMP,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..core.database import Base

SCHEMA = "gestion"


# ------------------------------------------------------------
# Enums (declarados sin crear el tipo — el SQL ya los creó)
# ------------------------------------------------------------

NivelCursoEnum = ENUM(
    "nt1", "nt2",
    "1_basico", "2_basico", "3_basico", "4_basico",
    "5_basico", "6_basico", "7_basico", "8_basico",
    "1_medio", "2_medio", "3_medio", "4_medio",
    name="nivel_curso", schema=SCHEMA, create_type=False,
)

DependenciaEnum = ENUM(
    "municipal",
    "particular_subvencionado",
    "particular_pagado",
    "corporacion_municipal",
    "servicio_local_educacion",
    "administracion_delegada",
    name="dependencia", schema=SCHEMA, create_type=False,
)

EstadoEstudianteEnum = ENUM(
    "activo", "retirado", "egresado", "congelado",
    name="estado_estudiante", schema=SCHEMA, create_type=False,
)

GeneroEnum = ENUM(
    "masculino", "femenino", "otro", "sin_informar",
    name="genero", schema=SCHEMA, create_type=False,
)

RolDocenteEnum = ENUM(
    "docente",
    "profesor_jefe",
    "orientador",
    "ute",
    "inspector",
    "direccion",
    "admin_colegio",
    "psicologo",
    name="rol_docente", schema=SCHEMA, create_type=False,
)

EstadoPersonaEnum = ENUM(
    "activo", "inactivo",
    name="estado_persona", schema=SCHEMA, create_type=False,
)


# ------------------------------------------------------------
# Modelos
# ------------------------------------------------------------

class Colegio(Base):
    __tablename__ = "colegio"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rbd: Mapped[str | None] = mapped_column(Text, unique=True)
    nombre: Mapped[str] = mapped_column(Text, nullable=False)
    razon_social: Mapped[str | None] = mapped_column(Text)
    rut: Mapped[str | None] = mapped_column(Text)
    dependencia: Mapped[str | None] = mapped_column(DependenciaEnum)
    direccion: Mapped[str | None] = mapped_column(Text)
    comuna: Mapped[str | None] = mapped_column(Text)
    region: Mapped[str | None] = mapped_column(Text)
    telefono: Mapped[str | None] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(Text)
    sitio_web: Mapped[str | None] = mapped_column(Text)
    logo_url: Mapped[str | None] = mapped_column(Text)
    estado: Mapped[str] = mapped_column(EstadoPersonaEnum, nullable=False, default="activo")
    creado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class Docente(Base):
    __tablename__ = "docente"
    __table_args__ = (
        UniqueConstraint("colegio_id", "rut", name="docente_colegio_rut_uk"),
        UniqueConstraint("colegio_id", "email", name="docente_colegio_email_uk"),
        {"schema": SCHEMA},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    colegio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.colegio.id", ondelete="CASCADE"),
        nullable=False,
    )
    rut: Mapped[str | None] = mapped_column(Text)
    nombres: Mapped[str] = mapped_column(Text, nullable=False)
    apellido_paterno: Mapped[str] = mapped_column(Text, nullable=False)
    apellido_materno: Mapped[str | None] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(Text)
    telefono: Mapped[str | None] = mapped_column(Text)
    roles: Mapped[list[str]] = mapped_column(
        ARRAY(RolDocenteEnum), nullable=False, server_default="{docente}"
    )
    estado: Mapped[str] = mapped_column(EstadoPersonaEnum, nullable=False, default="activo")
    creado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class Curso(Base):
    __tablename__ = "curso"
    __table_args__ = (
        UniqueConstraint("colegio_id", "ano", "nivel", "letra", name="curso_uk"),
        CheckConstraint("ano BETWEEN 2000 AND 2100", name="curso_ano_check"),
        {"schema": SCHEMA},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    colegio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.colegio.id", ondelete="CASCADE"),
        nullable=False,
    )
    ano: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    nivel: Mapped[str] = mapped_column(NivelCursoEnum, nullable=False)
    letra: Mapped[str] = mapped_column(Text, nullable=False)
    profesor_jefe_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.docente.id", ondelete="SET NULL"),
    )
    creado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class Estudiante(Base):
    __tablename__ = "estudiante"
    __table_args__ = (
        UniqueConstraint("colegio_id", "rut", name="estudiante_colegio_rut_uk"),
        {"schema": SCHEMA},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    colegio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.colegio.id", ondelete="CASCADE"),
        nullable=False,
    )
    rut: Mapped[str] = mapped_column(Text, nullable=False)
    nombres: Mapped[str] = mapped_column(Text, nullable=False)
    apellido_paterno: Mapped[str] = mapped_column(Text, nullable=False)
    apellido_materno: Mapped[str | None] = mapped_column(Text)
    fecha_nacimiento: Mapped[date | None] = mapped_column(Date)
    genero: Mapped[str | None] = mapped_column(GeneroEnum)
    direccion: Mapped[str | None] = mapped_column(Text)
    comuna: Mapped[str | None] = mapped_column(Text)
    email_personal: Mapped[str | None] = mapped_column(Text)
    estado: Mapped[str] = mapped_column(EstadoEstudianteEnum, nullable=False, default="activo")
    fecha_ingreso: Mapped[date | None] = mapped_column(Date)
    fecha_retiro: Mapped[date | None] = mapped_column(Date)
    observaciones: Mapped[str | None] = mapped_column(Text)
    creado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class EstudianteCurso(Base):
    __tablename__ = "estudiante_curso"
    __table_args__ = (
        UniqueConstraint("estudiante_id", "curso_id", name="estudiante_curso_uk"),
        {"schema": SCHEMA},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    estudiante_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.estudiante.id", ondelete="CASCADE"),
        nullable=False,
    )
    curso_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.curso.id", ondelete="CASCADE"),
        nullable=False,
    )
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False, server_default=func.current_date())
    fecha_termino: Mapped[date | None] = mapped_column(Date)
    numero_lista: Mapped[int | None] = mapped_column(SmallInteger)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    creado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
