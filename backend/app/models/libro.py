"""Modelos SQLAlchemy del libro de clases (schema `gestion`).

Asignaturas, carga académica, períodos, calificaciones, asistencia y anotaciones.
"""
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean, CheckConstraint, Date, ForeignKey, Numeric, SmallInteger,
    TIMESTAMP, Text, UniqueConstraint, func,
)
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..core.database import Base

SCHEMA = "gestion"


# ------------------------------------------------------------
# Enums
# ------------------------------------------------------------

TipoPeriodoEnum = ENUM(
    "semestral", "trimestral", "cuatrimestral", "anual",
    name="tipo_periodo", schema=SCHEMA, create_type=False,
)

EstadoAsistenciaEnum = ENUM(
    "presente", "ausente", "atrasado", "justificado", "retirado",
    name="estado_asistencia", schema=SCHEMA, create_type=False,
)

TipoAnotacionEnum = ENUM(
    "positiva", "negativa", "neutra",
    name="tipo_anotacion", schema=SCHEMA, create_type=False,
)


# ------------------------------------------------------------
# Modelos
# ------------------------------------------------------------

class Asignatura(Base):
    __tablename__ = "asignatura"
    __table_args__ = (
        UniqueConstraint("colegio_id", "codigo", name="asignatura_colegio_codigo_uk"),
        {"schema": SCHEMA},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    colegio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.colegio.id", ondelete="CASCADE"),
        nullable=False,
    )
    codigo: Mapped[str] = mapped_column(Text, nullable=False)
    nombre: Mapped[str] = mapped_column(Text, nullable=False)
    categoria: Mapped[str | None] = mapped_column(Text)
    color: Mapped[str | None] = mapped_column(Text)
    creado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class CursoAsignaturaDocente(Base):
    __tablename__ = "curso_asignatura_docente"
    __table_args__ = (
        UniqueConstraint("curso_id", "asignatura_id", name="carga_curso_asignatura_uk"),
        {"schema": SCHEMA},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    curso_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.curso.id", ondelete="CASCADE"),
        nullable=False,
    )
    asignatura_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.asignatura.id", ondelete="CASCADE"),
        nullable=False,
    )
    docente_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.docente.id", ondelete="RESTRICT"),
        nullable=False,
    )
    horas_semanales: Mapped[int | None] = mapped_column(SmallInteger)
    creado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class Periodo(Base):
    __tablename__ = "periodo"
    __table_args__ = (
        UniqueConstraint("colegio_id", "ano", "numero", name="periodo_uk"),
        CheckConstraint("ano BETWEEN 2000 AND 2100", name="periodo_ano_check"),
        CheckConstraint("numero BETWEEN 1 AND 4", name="periodo_numero_check"),
        CheckConstraint("fecha_termino > fecha_inicio", name="periodo_fechas_check"),
        {"schema": SCHEMA},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    colegio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.colegio.id", ondelete="CASCADE"),
        nullable=False,
    )
    ano: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    tipo: Mapped[str] = mapped_column(TipoPeriodoEnum, nullable=False, default="semestral")
    numero: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    nombre: Mapped[str] = mapped_column(Text, nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_termino: Mapped[date] = mapped_column(Date, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    creado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class Calificacion(Base):
    __tablename__ = "calificacion"
    __table_args__ = (
        CheckConstraint(
            "nota IS NULL OR (nota >= 1.0 AND nota <= 7.0)",
            name="calificacion_nota_check",
        ),
        CheckConstraint(
            "ponderacion BETWEEN 1 AND 1000",
            name="calificacion_ponderacion_check",
        ),
        {"schema": SCHEMA},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    estudiante_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.estudiante.id", ondelete="CASCADE"),
        nullable=False,
    )
    asignatura_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.asignatura.id", ondelete="CASCADE"),
        nullable=False,
    )
    periodo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.periodo.id", ondelete="CASCADE"),
        nullable=False,
    )
    docente_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.docente.id", ondelete="SET NULL"),
    )
    nota: Mapped[Decimal | None] = mapped_column(Numeric(2, 1))
    ponderacion: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=100)
    tipo: Mapped[str | None] = mapped_column(Text)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    creado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class Asistencia(Base):
    __tablename__ = "asistencia"
    __table_args__ = (
        UniqueConstraint("estudiante_id", "fecha", name="asistencia_estudiante_fecha_uk"),
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
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    estado: Mapped[str] = mapped_column(EstadoAsistenciaEnum, nullable=False)
    observacion: Mapped[str | None] = mapped_column(Text)
    registrada_por_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.docente.id", ondelete="SET NULL"),
    )
    creado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


class Anotacion(Base):
    __tablename__ = "anotacion"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    estudiante_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.estudiante.id", ondelete="CASCADE"),
        nullable=False,
    )
    docente_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.docente.id", ondelete="SET NULL"),
    )
    asignatura_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.asignatura.id", ondelete="SET NULL"),
    )
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    tipo: Mapped[str] = mapped_column(TipoAnotacionEnum, nullable=False, default="neutra")
    categoria: Mapped[str | None] = mapped_column(Text)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    creado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())


EstadoCitacionEnum = ENUM(
    "pendiente", "confirmada", "cumplida", "cancelada", "no_asiste",
    name="estado_citacion", schema=SCHEMA, create_type=False,
)

class Citacion(Base):
    __tablename__ = "citacion"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    estudiante_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.estudiante.id", ondelete="CASCADE"),
        nullable=False,
    )
    apoderado_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(f"{SCHEMA}.apoderado.id", ondelete="SET NULL"),
    )
    motivo: Mapped[str] = mapped_column(Text, nullable=False)
    fecha_citacion: Mapped[date] = mapped_column(Date, nullable=False)
    hora: Mapped[str | None] = mapped_column(Text)
    lugar: Mapped[str | None] = mapped_column(Text)
    estado: Mapped[str] = mapped_column(EstadoCitacionEnum, nullable=False, default="pendiente")
    resultado: Mapped[str | None] = mapped_column(Text)
    creado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
