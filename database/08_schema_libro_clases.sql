-- ============================================================
-- Sistema CEIS — Bloque 2: Libro de clases
-- Asignaturas, carga académica, períodos, notas, asistencia, anotaciones
-- Continúa en schema `gestion`
-- ============================================================

-- ------------------------------------------------------------
-- Enumeraciones
-- ------------------------------------------------------------

CREATE TYPE gestion.tipo_periodo AS ENUM (
  'semestral', 'trimestral', 'cuatrimestral', 'anual'
);

CREATE TYPE gestion.estado_asistencia AS ENUM (
  'presente', 'ausente', 'atrasado', 'justificado', 'retirado'
);

CREATE TYPE gestion.tipo_anotacion AS ENUM (
  'positiva', 'negativa', 'neutra'
);

-- ------------------------------------------------------------
-- Tabla: asignatura
-- Catálogo de asignaturas por colegio
-- ------------------------------------------------------------

CREATE TABLE gestion.asignatura (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id    UUID NOT NULL REFERENCES gestion.colegio(id) ON DELETE CASCADE,
  codigo        TEXT NOT NULL,                              -- MAT, LEN, HIS, CN...
  nombre        TEXT NOT NULL,                              -- "Matemática"
  categoria     TEXT,                                       -- "núcleo", "complementaria"
  color         TEXT,                                       -- hex para UI, opcional
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT asignatura_colegio_codigo_uk UNIQUE (colegio_id, codigo)
);

-- ------------------------------------------------------------
-- Tabla: curso_asignatura_docente
-- Carga académica: qué docente dicta qué asignatura en qué curso
-- ------------------------------------------------------------

CREATE TABLE gestion.curso_asignatura_docente (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  curso_id        UUID NOT NULL REFERENCES gestion.curso(id) ON DELETE CASCADE,
  asignatura_id   UUID NOT NULL REFERENCES gestion.asignatura(id) ON DELETE CASCADE,
  docente_id      UUID NOT NULL REFERENCES gestion.docente(id) ON DELETE RESTRICT,
  horas_semanales SMALLINT,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT carga_curso_asignatura_uk UNIQUE (curso_id, asignatura_id)
);

-- ------------------------------------------------------------
-- Tabla: periodo
-- Períodos académicos del colegio (semestres/trimestres)
-- ------------------------------------------------------------

CREATE TABLE gestion.periodo (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id    UUID NOT NULL REFERENCES gestion.colegio(id) ON DELETE CASCADE,
  ano           SMALLINT NOT NULL CHECK (ano BETWEEN 2000 AND 2100),
  tipo          gestion.tipo_periodo NOT NULL DEFAULT 'semestral',
  numero        SMALLINT NOT NULL CHECK (numero BETWEEN 1 AND 4),
  nombre        TEXT NOT NULL,                              -- "1er Semestre 2026"
  fecha_inicio  DATE NOT NULL,
  fecha_termino DATE NOT NULL,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT periodo_uk UNIQUE (colegio_id, ano, numero),
  CONSTRAINT periodo_fechas_check CHECK (fecha_termino > fecha_inicio)
);

-- ------------------------------------------------------------
-- Tabla: calificacion
-- Notas individuales en escala chilena 1.0 a 7.0
-- ------------------------------------------------------------

CREATE TABLE gestion.calificacion (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_id   UUID NOT NULL REFERENCES gestion.estudiante(id) ON DELETE CASCADE,
  asignatura_id   UUID NOT NULL REFERENCES gestion.asignatura(id) ON DELETE CASCADE,
  periodo_id      UUID NOT NULL REFERENCES gestion.periodo(id) ON DELETE CASCADE,
  docente_id      UUID REFERENCES gestion.docente(id) ON DELETE SET NULL,
  nota            NUMERIC(2,1) CHECK (nota IS NULL OR (nota >= 1.0 AND nota <= 7.0)),
  ponderacion     SMALLINT NOT NULL DEFAULT 100 CHECK (ponderacion BETWEEN 1 AND 1000),
  tipo            TEXT,                                     -- "coef_1", "coef_2", "examen"
  descripcion     TEXT NOT NULL,                            -- "Prueba unidad 3"
  fecha           DATE NOT NULL,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Tabla: asistencia
-- Registro diario por estudiante (un solo registro por día)
-- ------------------------------------------------------------

CREATE TABLE gestion.asistencia (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_id   UUID NOT NULL REFERENCES gestion.estudiante(id) ON DELETE CASCADE,
  curso_id        UUID NOT NULL REFERENCES gestion.curso(id) ON DELETE CASCADE,
  fecha           DATE NOT NULL,
  estado          gestion.estado_asistencia NOT NULL,
  observacion     TEXT,
  registrada_por_id UUID REFERENCES gestion.docente(id) ON DELETE SET NULL,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT asistencia_estudiante_fecha_uk UNIQUE (estudiante_id, fecha)
);

-- ------------------------------------------------------------
-- Tabla: anotacion
-- Observaciones conductuales / de rendimiento (positivas/negativas)
-- ------------------------------------------------------------

CREATE TABLE gestion.anotacion (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_id   UUID NOT NULL REFERENCES gestion.estudiante(id) ON DELETE CASCADE,
  docente_id      UUID REFERENCES gestion.docente(id) ON DELETE SET NULL,
  asignatura_id   UUID REFERENCES gestion.asignatura(id) ON DELETE SET NULL,
  fecha           DATE NOT NULL,
  tipo            gestion.tipo_anotacion NOT NULL DEFAULT 'neutra',
  categoria       TEXT,                                     -- conducta, esfuerzo, respeto…
  descripcion     TEXT NOT NULL,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Índices
-- ------------------------------------------------------------

CREATE INDEX idx_asignatura_colegio       ON gestion.asignatura(colegio_id);

CREATE INDEX idx_carga_curso              ON gestion.curso_asignatura_docente(curso_id);
CREATE INDEX idx_carga_docente            ON gestion.curso_asignatura_docente(docente_id);
CREATE INDEX idx_carga_asignatura         ON gestion.curso_asignatura_docente(asignatura_id);

CREATE INDEX idx_periodo_colegio_ano      ON gestion.periodo(colegio_id, ano);
CREATE INDEX idx_periodo_activo           ON gestion.periodo(activo);

CREATE INDEX idx_calificacion_estudiante  ON gestion.calificacion(estudiante_id);
CREATE INDEX idx_calificacion_periodo     ON gestion.calificacion(periodo_id);
CREATE INDEX idx_calificacion_asig_per    ON gestion.calificacion(asignatura_id, periodo_id);
CREATE INDEX idx_calificacion_fecha       ON gestion.calificacion(fecha);

CREATE INDEX idx_asistencia_curso_fecha   ON gestion.asistencia(curso_id, fecha);
CREATE INDEX idx_asistencia_estudiante    ON gestion.asistencia(estudiante_id);
CREATE INDEX idx_asistencia_fecha         ON gestion.asistencia(fecha);

CREATE INDEX idx_anotacion_estudiante     ON gestion.anotacion(estudiante_id, fecha DESC);
CREATE INDEX idx_anotacion_tipo           ON gestion.anotacion(tipo);
CREATE INDEX idx_anotacion_fecha          ON gestion.anotacion(fecha DESC);

-- ------------------------------------------------------------
-- Triggers de `actualizado_en` (reusa función creada en 06)
-- ------------------------------------------------------------

CREATE TRIGGER asignatura_touch    BEFORE UPDATE ON gestion.asignatura
  FOR EACH ROW EXECUTE FUNCTION gestion.touch_actualizado_en();
CREATE TRIGGER periodo_touch       BEFORE UPDATE ON gestion.periodo
  FOR EACH ROW EXECUTE FUNCTION gestion.touch_actualizado_en();
CREATE TRIGGER calificacion_touch  BEFORE UPDATE ON gestion.calificacion
  FOR EACH ROW EXECUTE FUNCTION gestion.touch_actualizado_en();
CREATE TRIGGER asistencia_touch    BEFORE UPDATE ON gestion.asistencia
  FOR EACH ROW EXECUTE FUNCTION gestion.touch_actualizado_en();
