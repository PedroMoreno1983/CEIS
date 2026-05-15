import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, Text, TIMESTAMP, Boolean, func
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import Mapped, mapped_column

from ..core.database import Base

SCHEMA = "public"

RolUsuarioEnum = ENUM(
    "admin", "directivo", "orientador", "docente", "apoderado",
    name="rol_usuario", schema=SCHEMA, create_type=False,
)


class Usuario(Base):
    __tablename__ = "usuario"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    nombres: Mapped[str] = mapped_column(Text, nullable=False)
    apellido_paterno: Mapped[str] = mapped_column(Text, nullable=False)
    apellido_materno: Mapped[str | None] = mapped_column(Text, nullable=True)
    rol: Mapped[str] = mapped_column(RolUsuarioEnum, nullable=False, default="docente")
    colegio_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("gestion.colegio.id", ondelete="SET NULL"), nullable=True
    )
    docente_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("gestion.docente.id", ondelete="SET NULL"), nullable=True
    )
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    ultimo_acceso: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
