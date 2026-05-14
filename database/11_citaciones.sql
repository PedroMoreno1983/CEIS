-- ============================================================
-- Sistema CEIS — Citaciones a apoderados
-- Schema `gestion`
-- ============================================================

CREATE TYPE gestion.estado_citacion AS ENUM (
  'pendiente', 'confirmada', 'cumplida', 'cancelada', 'no_asiste'
);

CREATE TABLE gestion.citacion (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estudiante_id   UUID NOT NULL REFERENCES gestion.estudiante(id) ON DELETE CASCADE,
  apoderado_id    UUID REFERENCES gestion.apoderado(id) ON DELETE SET NULL,
  motivo          TEXT NOT NULL,
  fecha_citacion  DATE NOT NULL,
  hora            TEXT,
  lugar           TEXT,
  estado          gestion.estado_citacion NOT NULL DEFAULT 'pendiente',
  resultado       TEXT,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_citacion_estudiante ON gestion.citacion(estudiante_id);
CREATE INDEX idx_citacion_apoderado  ON gestion.citacion(apoderado_id);
CREATE INDEX idx_citacion_fecha      ON gestion.citacion(fecha_citacion);
CREATE INDEX idx_citacion_estado     ON gestion.citacion(estado);

CREATE TRIGGER citacion_touch BEFORE UPDATE ON gestion.citacion
  FOR EACH ROW EXECUTE FUNCTION gestion.touch_actualizado_en();
