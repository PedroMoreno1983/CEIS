-- ============================================================
-- Sistema Generador de Instrumentos CEIS
-- Esquema de base de datos
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ------------------------------------------------------------
-- Enumeraciones
-- ------------------------------------------------------------

CREATE TYPE nivel_educativo AS ENUM (
  '5_6_basico',
  '8_basico',
  '2_medio',
  '4_medio'
);

CREATE TYPE tipo_instrumento AS ENUM (
  'razonamiento_verbal',       -- Analogías verbales
  'vocabulario',               -- Sinónimos
  'razonamiento_numerico',     -- Series numéricas
  'habilidad_numerica',        -- Operaciones aritméticas
  'habitos_estudio',           -- Afirmaciones SI/NO
  'comprension_lectora',       -- Texto + preguntas
  'rapidez_lectora',           -- Texto para leer
  'inteligencia_practica',     -- Escenarios cotidianos
  'intereses',                 -- Escala Likert 5 puntos
  'personalidad',              -- Escala Likert 5 puntos
  'adaptacion_motivacion'      -- Escala Likert 5 puntos
);

CREATE TYPE formato_respuesta AS ENUM (
  'opcion_multiple',           -- A, B, C, D, E
  'likert_5',                  -- Siempre → Nunca
  'likert_gusto',              -- Me gusta mucho → Me desagrada mucho
  'si_no',                     -- Sí / No
  'texto_libre'                -- Texto largo (comprensión lectora)
);

CREATE TYPE estado_item AS ENUM (
  'borrador',
  'revision',
  'aprobado',
  'rechazado'
);

CREATE TYPE origen_item AS ENUM (
  'original',    -- Extraído de la batería original CEIS
  'generado'     -- Generado por LLM
);

-- ------------------------------------------------------------
-- Tabla: item_banco
-- Ítems del banco (originales + generados)
-- ------------------------------------------------------------

CREATE TABLE item_banco (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nivel            nivel_educativo NOT NULL,
  tipo             tipo_instrumento NOT NULL,
  formato          formato_respuesta NOT NULL,
  origen           origen_item NOT NULL DEFAULT 'generado',

  -- Contenido principal
  enunciado        TEXT NOT NULL,
  instruccion      TEXT,           -- Instrucción específica si aplica

  -- Para comprensión lectora: el texto base
  texto_base       TEXT,

  -- Opciones de respuesta (JSON array de {clave, texto})
  opciones         JSONB,          -- [{"clave":"A","texto":"..."}, ...]
  respuesta_correcta TEXT,         -- Clave de la opción correcta (si aplica)

  -- Metadatos psicométricos
  dificultad       SMALLINT CHECK (dificultad BETWEEN 1 AND 5),
  constructo       TEXT,           -- Qué mide exactamente este ítem
  tiempo_segundos  SMALLINT,       -- Tiempo estimado en segundos

  -- Control de calidad
  estado           estado_item NOT NULL DEFAULT 'borrador',
  confianza_generacion NUMERIC(4,3),  -- Score 0-1 de confianza del LLM
  justificacion_generacion TEXT,

  -- Auditoría
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revisado_en      TIMESTAMPTZ,
  revisado_por     TEXT
);

-- ------------------------------------------------------------
-- Tabla: instrumento_generado
-- Una batería o subprueba completa ensamblada
-- ------------------------------------------------------------

CREATE TABLE instrumento_generado (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre           TEXT NOT NULL,
  nivel            nivel_educativo NOT NULL,
  tipo             tipo_instrumento NOT NULL,
  descripcion      TEXT,
  instrucciones    TEXT,           -- Instrucciones al aplicador
  tiempo_minutos   SMALLINT,
  num_items        SMALLINT,
  estado           estado_item NOT NULL DEFAULT 'borrador',
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_por       TEXT
);

-- ------------------------------------------------------------
-- Tabla: instrumento_item
-- Ítems dentro de un instrumento generado (con orden)
-- ------------------------------------------------------------

CREATE TABLE instrumento_item (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instrumento_id        UUID NOT NULL REFERENCES instrumento_generado(id) ON DELETE CASCADE,
  item_id               UUID NOT NULL REFERENCES item_banco(id),
  orden                 SMALLINT NOT NULL,
  UNIQUE (instrumento_id, orden)
);

-- ------------------------------------------------------------
-- Tabla: sesion_generacion
-- Registro de cada llamada al LLM para generación
-- ------------------------------------------------------------

CREATE TABLE sesion_generacion (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nivel            nivel_educativo NOT NULL,
  tipo             tipo_instrumento NOT NULL,
  num_solicitados  SMALLINT NOT NULL,
  num_generados    SMALLINT,
  num_aprobados    SMALLINT,
  prompt_usado     TEXT,
  modelo_llm       TEXT,
  tokens_usados    INT,
  duracion_ms      INT,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Índices
-- ------------------------------------------------------------

CREATE INDEX idx_item_banco_nivel_tipo ON item_banco(nivel, tipo);
CREATE INDEX idx_item_banco_estado ON item_banco(estado);
CREATE INDEX idx_item_banco_origen ON item_banco(origen);
CREATE INDEX idx_item_banco_enunciado_trgm ON item_banco USING GIN (enunciado gin_trgm_ops);
CREATE INDEX idx_instrumento_generado_nivel ON instrumento_generado(nivel, tipo);
