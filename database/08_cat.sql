-- ============================================================
-- Computerized Adaptive Testing (CAT) — Rasch 1PL
-- ============================================================

-- Calibración psicométrica de cada ítem (modelo Rasch 1PL)
-- b = dificultad en logits (típicamente -3 a +3)
-- a = discriminación (1.0 fijo para Rasch; queda preparado para 2PL futuro)
CREATE TABLE item_calibracion (
  item_id           UUID PRIMARY KEY REFERENCES item_banco(id) ON DELETE CASCADE,
  b                 NUMERIC(6,3) NOT NULL DEFAULT 0.0,   -- dificultad en logits
  a                 NUMERIC(6,3) NOT NULL DEFAULT 1.0,   -- discriminación
  n_respuestas      INTEGER NOT NULL DEFAULT 0,
  n_correctas       INTEGER NOT NULL DEFAULT 0,
  fuente            TEXT NOT NULL DEFAULT 'prior',       -- 'prior' (declarada) | 'empirica' (de datos)
  actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calibracion_b ON item_calibracion(b);

-- Sembrar calibración inicial desde dificultad declarada (1-5 → -2 a +2 logits)
INSERT INTO item_calibracion (item_id, b, fuente)
SELECT
  id,
  -- mapeo lineal: dificultad 1 → -2, 3 → 0, 5 → +2
  COALESCE((dificultad::numeric - 3.0), 0.0),
  'prior'
FROM item_banco
ON CONFLICT (item_id) DO NOTHING;

-- Campos CAT en aplicación
ALTER TABLE aplicacion ADD COLUMN IF NOT EXISTS es_adaptativa BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE aplicacion ADD COLUMN IF NOT EXISTS theta_actual NUMERIC(6,3) DEFAULT 0.0;
ALTER TABLE aplicacion ADD COLUMN IF NOT EXISTS se_actual NUMERIC(6,3) DEFAULT 1.0;
ALTER TABLE aplicacion ADD COLUMN IF NOT EXISTS max_items INTEGER DEFAULT 30;
ALTER TABLE aplicacion ADD COLUMN IF NOT EXISTS se_objetivo NUMERIC(4,3) DEFAULT 0.300;

-- En respuesta agregamos snapshot del θ post-respuesta
ALTER TABLE respuesta ADD COLUMN IF NOT EXISTS theta_post NUMERIC(6,3);
ALTER TABLE respuesta ADD COLUMN IF NOT EXISTS se_post NUMERIC(6,3);
