import uuid
from datetime import datetime
from sqlalchemy import Text, Integer, ForeignKey, Boolean, Numeric, TIMESTAMP, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import Mapped, mapped_column
from ..core.database import Base

EstadoAplicacionEnum = ENUM(
    "pendiente", "en_curso", "finalizada", "cancelada",
    name="estado_aplicacion", create_type=False,
)


class Aplicacion(Base):
    __tablename__ = "aplicacion"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    instrumento_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("instrumento_generado.id", ondelete="CASCADE"),
        nullable=False,
    )
    codigo: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    estudiante_nombre: Mapped[str | None] = mapped_column(Text)
    estudiante_curso: Mapped[str | None] = mapped_column(Text)
    estudiante_rut: Mapped[str | None] = mapped_column(Text)
    estado: Mapped[str] = mapped_column(EstadoAplicacionEnum, nullable=False, default="pendiente")
    iniciada_en: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    finalizada_en: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    tiempo_total_segundos: Mapped[int | None] = mapped_column(Integer)
    puntaje_correctas: Mapped[int | None] = mapped_column(Integer)
    puntaje_total: Mapped[int | None] = mapped_column(Integer)
    creado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    creado_por: Mapped[str | None] = mapped_column(Text)

    # CAT
    es_adaptativa: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    theta_actual: Mapped[float | None] = mapped_column(Numeric(6, 3), default=0.0)
    se_actual: Mapped[float | None] = mapped_column(Numeric(6, 3), default=1.0)
    max_items: Mapped[int | None] = mapped_column(Integer, default=30)
    se_objetivo: Mapped[float | None] = mapped_column(Numeric(4, 3), default=0.300)


class Respuesta(Base):
    __tablename__ = "respuesta"
    __table_args__ = (UniqueConstraint("aplicacion_id", "item_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    aplicacion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("aplicacion.id", ondelete="CASCADE"), nullable=False,
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("item_banco.id"), nullable=False,
    )
    respuesta: Mapped[str | None] = mapped_column(Text)
    tiempo_segundos: Mapped[int | None] = mapped_column(Integer)
    correcta: Mapped[bool | None] = mapped_column(Boolean)
    respondida_en: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
