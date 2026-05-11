-- ============================================================
-- Migración: ampliar enum tipo_instrumento + agregar imagen_url
-- ============================================================

-- Ampliar enum con todas las subpruebas reales de las baterías CEIS
ALTER TYPE tipo_instrumento ADD VALUE IF NOT EXISTS 'razonamiento_abstracto';
ALTER TYPE tipo_instrumento ADD VALUE IF NOT EXISTS 'razonamiento_espacial';
ALTER TYPE tipo_instrumento ADD VALUE IF NOT EXISTS 'razonamiento_mecanico';
ALTER TYPE tipo_instrumento ADD VALUE IF NOT EXISTS 'aptitud_espacial';
ALTER TYPE tipo_instrumento ADD VALUE IF NOT EXISTS 'atencion';
ALTER TYPE tipo_instrumento ADD VALUE IF NOT EXISTS 'memoria_visual';
ALTER TYPE tipo_instrumento ADD VALUE IF NOT EXISTS 'memoria_auditiva';
ALTER TYPE tipo_instrumento ADD VALUE IF NOT EXISTS 'rapidez_perceptiva';
ALTER TYPE tipo_instrumento ADD VALUE IF NOT EXISTS 'estrategias_aprendizaje';
ALTER TYPE tipo_instrumento ADD VALUE IF NOT EXISTS 'elecciones_profesionales';
ALTER TYPE tipo_instrumento ADD VALUE IF NOT EXISTS 'calculo_aritmetico';
ALTER TYPE tipo_instrumento ADD VALUE IF NOT EXISTS 'calculo_numerico';

-- Imagen del enunciado (para subpruebas visuales, ruta relativa: items/<uuid>.png)
ALTER TABLE item_banco ADD COLUMN IF NOT EXISTS imagen_url TEXT;
-- Imagen alternativa de las opciones (cuando las opciones también son figuras)
ALTER TABLE item_banco ADD COLUMN IF NOT EXISTS imagen_opciones_url TEXT;
-- Marca si el ítem es esencialmente visual (no se puede generar por texto)
ALTER TABLE item_banco ADD COLUMN IF NOT EXISTS requiere_imagen BOOLEAN NOT NULL DEFAULT FALSE;
-- Página de origen para trazabilidad
ALTER TABLE item_banco ADD COLUMN IF NOT EXISTS pagina_origen INT;
ALTER TABLE item_banco ADD COLUMN IF NOT EXISTS cuadernillo_origen TEXT;
