-- ============================================================
-- Sistema CEIS — Bloque 1: Cimientos de gestión escolar
-- Schema separado `gestion` para colegios, cursos, estudiantes, docentes
-- ============================================================

CREATE SCHEMA IF NOT EXISTS gestion;

-- ------------------------------------------------------------
-- Enumeraciones (en schema gestion para no contaminar el default)
-- ------------------------------------------------------------

CREATE TYPE gestion.nivel_curso AS ENUM (
  'nt1', 'nt2',
  '1_basico', '2_basico', '3_basico', '4_basico',
  '5_basico', '6_basico', '7_basico', '8_basico',
  '1_medio', '2_medio', '3_medio', '4_medio'
);

CREATE TYPE gestion.dependencia AS ENUM (
  'municipal',
  'particular_subvencionado',
  'particular_pagado',
  'corporacion_municipal',
  'servicio_local_educacion',
  'administracion_delegada'
);

CREATE TYPE gestion.estado_estudiante AS ENUM (
  'activo', 'retirado', 'egresado', 'congelado'
);

CREATE TYPE gestion.genero AS ENUM (
  'masculino', 'femenino', 'otro', 'sin_informar'
);

CREATE TYPE gestion.rol_docente AS ENUM (
  'docente',
  'profesor_jefe',
  'orientador',
  'ute',
  'inspector',
  'direccion',
  'admin_colegio',
  'psicologo'
);

CREATE TYPE gestion.estado_persona AS ENUM (
  'activo', 'inactivo'
);

-- ------------------------------------------------------------
-- Tabla: colegio
-- Cliente CEIS (institución educativa)
-- ------------------------------------------------------------

CREATE TABLE gestion.colegio (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rbd             TEXT UNIQUE,                       -- Rol Base de Datos Mineduc
  nombre          TEXT NOT NULL,
  razon_social    TEXT,
  rut             TEXT,
  dependencia     gestion.dependencia,
  direccion       TEXT,
  comuna          TEXT,
  region          TEXT,
  telefono        TEXT,
  email           TEXT,
  sitio_web       TEXT,
  logo_url        TEXT,
  estado          gestion.estado_persona NOT NULL DEFAULT 'activo',
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Tabla: docente
-- Personal del colegio (docentes, jefatura, orientación, dirección)
-- Una misma persona puede tener múltiples roles → roles[]
-- ------------------------------------------------------------

CREATE TABLE gestion.docente (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id        UUID NOT NULL REFERENCES gestion.colegio(id) ON DELETE CASCADE,
  rut               TEXT,
  nombres           TEXT NOT NULL,
  apellido_paterno  TEXT NOT NULL,
  apellido_materno  TEXT,
  email             TEXT,
  telefono          TEXT,
  roles             gestion.rol_docente[] NOT NULL DEFAULT ARRAY['docente']::gestion.rol_docente[],
  estado            gestion.estado_persona NOT NULL DEFAULT 'activo',
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT docente_colegio_rut_uk UNIQUE (colegio_id, rut),
  CONSTRAINT docente_colegio_email_uk UNIQUE (colegio_id, email)
);

-- ------------------------------------------------------------
-- Tabla: curso
-- Curso académico (colegio + año + nivel + letra)
-- ------------------------------------------------------------

CREATE TABLE gestion.curso (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id        UUID NOT NULL REFERENCES gestion.colegio(id) ON DELETE CASCADE,
  ano               SMALLINT NOT NULL CHECK (ano BETWEEN 2000 AND 2100),
  nivel             gestion.nivel_curso NOT NULL,
  letra             TEXT NOT NULL,
  profesor_jefe_id  UUID REFERENCES gestion.docente(id) ON DELETE SET NULL,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT curso_uk UNIQUE (colegio_id, ano, nivel, letra)
);

-- ------------------------------------------------------------
-- Tabla: estudiante
-- Estudiante con identidad persistente (RUT único por colegio)
-- ------------------------------------------------------------

CREATE TABLE gestion.estudiante (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colegio_id        UUID NOT NULL REFERENCES gestion.colegio(id) ON DELETE CASCADE,
  rut               TEXT NOT NULL,
  nombres           TEXT NOT NULL,
  apellido_paterno  TEXT NOT NULL,
  apellido_materno  TEXT,
  fecha_nacimiento  DATE,
  genero            gestion.genero,
  direccion         TEXT,
  comuna            TEXT,
  email_personal    TEXT,
  estado            gestion.estado_estudiante NOT NULL DEFAULT 'activo',
  fecha_ingreso     DATE,
  fecha_retiro      DATE,
  observaciones     TEXT,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT estudiante_colegio_rut_uk UNIQUE (colegio_id, rut)
);

-- ------------------------------------------------------------
-- Tabla: estudiante_curso
-- Relación estudiante ↔ curso (histórico longitudinal)
-- Un estudiante puede tener múltiples cursos a lo largo del tiempo
-- ------------------------------------------------------------

CREATE TABLE gestion.estudiante_curso (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_id   UUID NOT NULL REFERENCES gestion.estudiante(id) ON DELETE CASCADE,
  curso_id        UUID NOT NULL REFERENCES gestion.curso(id) ON DELETE CASCADE,
  fecha_inicio    DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_termino   DATE,
  numero_lista    SMALLINT,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT estudiante_curso_uk UNIQUE (estudiante_id, curso_id)
);

-- ------------------------------------------------------------
-- Índices
-- ------------------------------------------------------------

CREATE INDEX idx_colegio_estado          ON gestion.colegio(estado);
CREATE INDEX idx_colegio_dependencia     ON gestion.colegio(dependencia);

CREATE INDEX idx_docente_colegio         ON gestion.docente(colegio_id);
CREATE INDEX idx_docente_email           ON gestion.docente(email);
CREATE INDEX idx_docente_rut             ON gestion.docente(rut);

CREATE INDEX idx_curso_colegio_ano       ON gestion.curso(colegio_id, ano);
CREATE INDEX idx_curso_profesor_jefe     ON gestion.curso(profesor_jefe_id);

CREATE INDEX idx_estudiante_colegio      ON gestion.estudiante(colegio_id);
CREATE INDEX idx_estudiante_rut          ON gestion.estudiante(rut);
CREATE INDEX idx_estudiante_estado       ON gestion.estudiante(estado);
CREATE INDEX idx_estudiante_apellido_trgm ON gestion.estudiante USING GIN (apellido_paterno gin_trgm_ops);

CREATE INDEX idx_estcurso_estudiante     ON gestion.estudiante_curso(estudiante_id, activo);
CREATE INDEX idx_estcurso_curso          ON gestion.estudiante_curso(curso_id, activo);

-- ------------------------------------------------------------
-- Trigger: actualizar `actualizado_en` automáticamente
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION gestion.touch_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER colegio_touch    BEFORE UPDATE ON gestion.colegio
  FOR EACH ROW EXECUTE FUNCTION gestion.touch_actualizado_en();
CREATE TRIGGER docente_touch    BEFORE UPDATE ON gestion.docente
  FOR EACH ROW EXECUTE FUNCTION gestion.touch_actualizado_en();
CREATE TRIGGER curso_touch      BEFORE UPDATE ON gestion.curso
  FOR EACH ROW EXECUTE FUNCTION gestion.touch_actualizado_en();
CREATE TRIGGER estudiante_touch BEFORE UPDATE ON gestion.estudiante
  FOR EACH ROW EXECUTE FUNCTION gestion.touch_actualizado_en();
