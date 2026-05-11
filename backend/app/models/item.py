import uuid
from datetime import datetime
from sqlalchemy import String, Text, SmallInteger, Numeric, TIMESTAMP, Boolean, Integer, func
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM
from sqlalchemy.orm import Mapped, mapped_column
from ..core.database import Base

NivelEnum = ENUM(
    "5_6_basico", "8_basico", "2_medio", "4_medio",
    name="nivel_educativo", create_type=False
)
TipoEnum = ENUM(
    "razonamiento_verbal", "vocabulario", "razonamiento_numerico",
    "habilidad_numerica", "habitos_estudio", "comprension_lectora",
    "rapidez_lectora", "inteligencia_practica", "intereses",
    "personalidad", "adaptacion_motivacion",
    "razonamiento_abstracto", "razonamiento_espacial", "razonamiento_mecanico",
    "aptitud_espacial", "atencion", "memoria_visual", "memoria_auditiva",
    "rapidez_perceptiva", "estrategias_aprendizaje", "elecciones_profesionales",
    "calculo_aritmetico", "calculo_numerico", "evaluacion_integral",
    name="tipo_instrumento", create_type=False
)
FormatoEnum = ENUM(
    "opcion_multiple", "likert_5", "likert_gusto", "si_no", "texto_libre",
    name="formato_respuesta", create_type=False
)
EstadoEnum = ENUM(
    "borrador", "revision", "aprobado", "rechazado",
    name="estado_item", create_type=False
)
OrigenEnum = ENUM(
    "original", "generado",
    name="origen_item", create_type=False
)


class ItemBanco(Base):
    __tablename__ = "item_banco"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nivel: Mapped[str] = mapped_column(NivelEnum, nullable=False)
    tipo: Mapped[str] = mapped_column(TipoEnum, nullable=False)
    formato: Mapped[str] = mapped_column(FormatoEnum, nullable=False)
    origen: Mapped[str] = mapped_column(OrigenEnum, nullable=False, default="generado")

    enunciado: Mapped[str] = mapped_column(Text, nullable=False)
    instruccion: Mapped[str | None] = mapped_column(Text)
    texto_base: Mapped[str | None] = mapped_column(Text)
    opciones: Mapped[dict | None] = mapped_column(JSONB)
    respuesta_correcta: Mapped[str | None] = mapped_column(Text)

    dificultad: Mapped[int | None] = mapped_column(SmallInteger)
    constructo: Mapped[str | None] = mapped_column(Text)
    tiempo_segundos: Mapped[int | None] = mapped_column(SmallInteger)

    estado: Mapped[str] = mapped_column(EstadoEnum, nullable=False, default="borrador")
    confianza_generacion: Mapped[float | None] = mapped_column(Numeric(4, 3))
    justificacion_generacion: Mapped[str | None] = mapped_column(Text)

    imagen_url: Mapped[str | None] = mapped_column(Text)
    imagen_opciones_url: Mapped[str | None] = mapped_column(Text)
    requiere_imagen: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    pagina_origen: Mapped[int | None] = mapped_column(Integer)
    cuadernillo_origen: Mapped[str | None] = mapped_column(Text)

    creado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    revisado_en: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    revisado_por: Mapped[str | None] = mapped_column(String(200))


class InstrumentoGenerado(Base):
    __tablename__ = "instrumento_generado"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(Text, nullable=False)
    nivel: Mapped[str] = mapped_column(NivelEnum, nullable=False)
    tipo: Mapped[str] = mapped_column(TipoEnum, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text)
    instrucciones: Mapped[str | None] = mapped_column(Text)
    tiempo_minutos: Mapped[int | None] = mapped_column(SmallInteger)
    num_items: Mapped[int | None] = mapped_column(SmallInteger)
    estado: Mapped[str] = mapped_column(EstadoEnum, nullable=False, default="borrador")
    creado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
    creado_por: Mapped[str | None] = mapped_column(String(200))


class SesionGeneracion(Base):
    __tablename__ = "sesion_generacion"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nivel: Mapped[str] = mapped_column(NivelEnum, nullable=False)
    tipo: Mapped[str] = mapped_column(TipoEnum, nullable=False)
    num_solicitados: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    num_generados: Mapped[int | None] = mapped_column(SmallInteger)
    num_aprobados: Mapped[int | None] = mapped_column(SmallInteger)
    prompt_usado: Mapped[str | None] = mapped_column(Text)
    modelo_llm: Mapped[str | None] = mapped_column(Text)
    tokens_usados: Mapped[int | None] = mapped_column()
    duracion_ms: Mapped[int | None] = mapped_column()
    creado_en: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
