-- ============================================================
-- Modo de aplicación interactiva: el estudiante responde en pantalla
-- ============================================================

CREATE TYPE estado_aplicacion AS ENUM (
  'pendiente',   -- generada, esperando que el estudiante entre
  'en_curso',    -- estudiante respondiendo
  'finalizada',  -- terminó (manual o por tiempo)
  'cancelada'
);

CREATE TABLE aplicacion (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instrumento_id      UUID NOT NULL REFERENCES instrumento_generado(id) ON DELETE CASCADE,
  codigo              TEXT NOT NULL UNIQUE,        -- código corto para acceso
  estudiante_nombre   TEXT,
  estudiante_curso    TEXT,
  estudiante_rut      TEXT,
  estado              estado_aplicacion NOT NULL DEFAULT 'pendiente',
  iniciada_en         TIMESTAMPTZ,
  finalizada_en       TIMESTAMPTZ,
  tiempo_total_segundos INT,
  puntaje_correctas   INT,
  puntaje_total       INT,
  creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_por          TEXT
);

CREATE INDEX idx_aplicacion_codigo ON aplicacion(codigo);
CREATE INDEX idx_aplicacion_instrumento ON aplicacion(instrumento_id);
CREATE INDEX idx_aplicacion_estado ON aplicacion(estado);

CREATE TABLE respuesta (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aplicacion_id   UUID NOT NULL REFERENCES aplicacion(id) ON DELETE CASCADE,
  item_id         UUID NOT NULL REFERENCES item_banco(id),
  respuesta       TEXT,           -- clave (A, B, ..., S, N) o texto libre
  tiempo_segundos INT,            -- tiempo en este ítem
  correcta        BOOLEAN,        -- null si la subprueba no tiene respuesta correcta
  respondida_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (aplicacion_id, item_id)
);

CREATE INDEX idx_respuesta_aplicacion ON respuesta(aplicacion_id);

-- ------------------------------------------------------------
-- Migración: aplicacion → vincular opcionalmente a entidades de gestión
-- (movido desde 06_schema_gestion.sql para respetar orden de creación)
-- ------------------------------------------------------------

ALTER TABLE aplicacion
  ADD COLUMN IF NOT EXISTS estudiante_id UUID REFERENCES gestion.estudiante(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS curso_id      UUID REFERENCES gestion.curso(id)      ON DELETE SET NULL;

CREATE INDEX idx_aplicacion_estudiante ON aplicacion(estudiante_id);
CREATE INDEX idx_aplicacion_curso      ON aplicacion(curso_id);
