-- ============================================================
-- Sistema CEIS — Bloque 3: Comunicación con familias, Plan de mejora, PIE
-- Schema `gestion`
-- ============================================================

-- ------------------------------------------------------------
-- Enumeraciones
-- ------------------------------------------------------------

CREATE TYPE gestion.tipo_apoderado AS ENUM (
  'padre', 'madre', 'tutor_legal', 'abuelo', 'abuela', 'tio', 'tia', 'otro'
);

CREATE TYPE gestion.tipo_mensaje AS ENUM (
  'individual',   -- a 1 apoderado/estudiante
  'curso',        -- broadcast a todos los apoderados del curso
  'general'       -- broadcast a todos los apoderados del colegio
);

CREATE TYPE gestion.estado_plan AS ENUM (
  'borrador', 'activo', 'logrado', 'no_logrado', 'cerrado'
);

CREATE TYPE gestion.prioridad_objetivo AS ENUM (
  'alta', 'media', 'baja'
);

CREATE TYPE gestion.estado_objetivo AS ENUM (
  'pendiente', 'en_curso', 'logrado', 'no_logrado'
);

CREATE TYPE gestion.tipo_pie AS ENUM (
  'permanente', 'transitorio'
);

CREATE TYPE gestion.estado_pie AS ENUM (
  'activo', 'egresado', 'derivado', 'cerrado'
);

-- ============================================================
-- Apoderados
-- ============================================================

CREATE TABLE gestion.apoderado (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id        UUID NOT NULL REFERENCES gestion.colegio(id) ON DELETE CASCADE,
  rut               TEXT,
  nombres           TEXT NOT NULL,
  apellido_paterno  TEXT NOT NULL,
  apellido_materno  TEXT,
  email             TEXT,
  telefono          TEXT,
  telefono_alt      TEXT,
  profesion         TEXT,
  direccion         TEXT,
  comuna            TEXT,
  estado            gestion.estado_persona NOT NULL DEFAULT 'activo',
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT apoderado_colegio_rut_uk UNIQUE (colegio_id, rut)
);

CREATE TABLE gestion.estudiante_apoderado (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_id   UUID NOT NULL REFERENCES gestion.estudiante(id) ON DELETE CASCADE,
  apoderado_id    UUID NOT NULL REFERENCES gestion.apoderado(id) ON DELETE CASCADE,
  tipo            gestion.tipo_apoderado NOT NULL DEFAULT 'otro',
  es_principal    BOOLEAN NOT NULL DEFAULT FALSE,
  vive_con        BOOLEAN NOT NULL DEFAULT FALSE,
  retira_estudiante BOOLEAN NOT NULL DEFAULT TRUE,  -- ¿puede retirar al estudiante?
  observaciones   TEXT,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT estudiante_apoderado_uk UNIQUE (estudiante_id, apoderado_id)
);

-- ============================================================
-- Mensajes (comunicación colegio → familias)
-- ============================================================

CREATE TABLE gestion.mensaje (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id      UUID NOT NULL REFERENCES gestion.colegio(id) ON DELETE CASCADE,
  autor_docente_id UUID REFERENCES gestion.docente(id) ON DELETE SET NULL,
  tipo            gestion.tipo_mensaje NOT NULL DEFAULT 'individual',
  asunto          TEXT NOT NULL,
  contenido       TEXT NOT NULL,
  importante      BOOLEAN NOT NULL DEFAULT FALSE,
  -- Para tipo='curso': curso destinatario
  curso_id        UUID REFERENCES gestion.curso(id) ON DELETE SET NULL,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gestion.mensaje_destinatario (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mensaje_id      UUID NOT NULL REFERENCES gestion.mensaje(id) ON DELETE CASCADE,
  apoderado_id    UUID NOT NULL REFERENCES gestion.apoderado(id) ON DELETE CASCADE,
  -- Estudiante de referencia (sobre quién es el mensaje, opcional)
  estudiante_id   UUID REFERENCES gestion.estudiante(id) ON DELETE SET NULL,
  leido_en        TIMESTAMPTZ,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mensaje_destinatario_uk UNIQUE (mensaje_id, apoderado_id)
);

-- ============================================================
-- Plan de mejora
-- ============================================================

CREATE TABLE gestion.plan_mejora (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_id         UUID NOT NULL REFERENCES gestion.estudiante(id) ON DELETE CASCADE,
  autor_docente_id      UUID REFERENCES gestion.docente(id) ON DELETE SET NULL,
  titulo                TEXT NOT NULL,
  descripcion           TEXT,
  estado                gestion.estado_plan NOT NULL DEFAULT 'borrador',
  fecha_inicio          DATE NOT NULL,
  fecha_termino_estim   DATE,
  fecha_termino_real    DATE,
  creado_en             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gestion.objetivo_plan (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id         UUID NOT NULL REFERENCES gestion.plan_mejora(id) ON DELETE CASCADE,
  descripcion     TEXT NOT NULL,
  prioridad       gestion.prioridad_objetivo NOT NULL DEFAULT 'media',
  estado          gestion.estado_objetivo NOT NULL DEFAULT 'pendiente',
  fecha_objetivo  DATE,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gestion.seguimiento_plan (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id         UUID NOT NULL REFERENCES gestion.plan_mejora(id) ON DELETE CASCADE,
  fecha           DATE NOT NULL,
  autor_docente_id UUID REFERENCES gestion.docente(id) ON DELETE SET NULL,
  descripcion     TEXT NOT NULL,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PIE — Programa de Integración Escolar (NEE)
-- ============================================================

CREATE TABLE gestion.pie_diagnostico (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_id         UUID NOT NULL REFERENCES gestion.estudiante(id) ON DELETE CASCADE,
  tipo                  gestion.tipo_pie NOT NULL,
  diagnostico           TEXT NOT NULL,                   -- texto descriptivo del diagnóstico
  fecha_diagnostico     DATE NOT NULL,
  profesional_responsable TEXT,                          -- psicopedagogo, fonoaudiólogo, etc.
  estado                gestion.estado_pie NOT NULL DEFAULT 'activo',
  fecha_ingreso_pie     DATE,
  fecha_egreso_pie      DATE,
  observaciones         TEXT,
  creado_en             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gestion.pie_intervencion (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  diagnostico_id    UUID NOT NULL REFERENCES gestion.pie_diagnostico(id) ON DELETE CASCADE,
  fecha             DATE NOT NULL,
  profesional       TEXT NOT NULL,
  duracion_minutos  SMALLINT,
  descripcion       TEXT NOT NULL,
  observaciones     TEXT,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Índices
-- ============================================================

CREATE INDEX idx_apoderado_colegio       ON gestion.apoderado(colegio_id);
CREATE INDEX idx_apoderado_rut           ON gestion.apoderado(rut);
CREATE INDEX idx_apoderado_email         ON gestion.apoderado(email);
CREATE INDEX idx_apoderado_apellido_trgm ON gestion.apoderado USING GIN (apellido_paterno gin_trgm_ops);

CREATE INDEX idx_estap_estudiante        ON gestion.estudiante_apoderado(estudiante_id);
CREATE INDEX idx_estap_apoderado         ON gestion.estudiante_apoderado(apoderado_id);
CREATE INDEX idx_estap_principal         ON gestion.estudiante_apoderado(estudiante_id, es_principal);

CREATE INDEX idx_mensaje_colegio         ON gestion.mensaje(colegio_id, creado_en DESC);
CREATE INDEX idx_mensaje_curso           ON gestion.mensaje(curso_id);

CREATE INDEX idx_mdest_mensaje           ON gestion.mensaje_destinatario(mensaje_id);
CREATE INDEX idx_mdest_apoderado         ON gestion.mensaje_destinatario(apoderado_id, leido_en);
CREATE INDEX idx_mdest_estudiante        ON gestion.mensaje_destinatario(estudiante_id);

CREATE INDEX idx_plan_estudiante         ON gestion.plan_mejora(estudiante_id);
CREATE INDEX idx_plan_estado             ON gestion.plan_mejora(estado);

CREATE INDEX idx_objetivo_plan           ON gestion.objetivo_plan(plan_id);
CREATE INDEX idx_objetivo_estado         ON gestion.objetivo_plan(estado);

CREATE INDEX idx_seguimiento_plan        ON gestion.seguimiento_plan(plan_id, fecha DESC);

CREATE INDEX idx_pie_estudiante          ON gestion.pie_diagnostico(estudiante_id);
CREATE INDEX idx_pie_estado              ON gestion.pie_diagnostico(estado);
CREATE INDEX idx_pie_tipo                ON gestion.pie_diagnostico(tipo);

CREATE INDEX idx_pieint_diagnostico      ON gestion.pie_intervencion(diagnostico_id, fecha DESC);

-- ============================================================
-- Triggers de actualizado_en
-- ============================================================

CREATE TRIGGER apoderado_touch       BEFORE UPDATE ON gestion.apoderado
  FOR EACH ROW EXECUTE FUNCTION gestion.touch_actualizado_en();
CREATE TRIGGER plan_mejora_touch     BEFORE UPDATE ON gestion.plan_mejora
  FOR EACH ROW EXECUTE FUNCTION gestion.touch_actualizado_en();
CREATE TRIGGER objetivo_plan_touch   BEFORE UPDATE ON gestion.objetivo_plan
  FOR EACH ROW EXECUTE FUNCTION gestion.touch_actualizado_en();
CREATE TRIGGER pie_diagnostico_touch BEFORE UPDATE ON gestion.pie_diagnostico
  FOR EACH ROW EXECUTE FUNCTION gestion.touch_actualizado_en();
