-- ============================================================
-- Sistema CEIS — Autenticación y autorización
-- Schema `public`
-- ============================================================

CREATE TYPE public.rol_usuario AS ENUM (
  'admin',
  'directivo',
  'orientador',
  'docente',
  'apoderado'
);

CREATE TABLE public.usuario (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  nombres         TEXT NOT NULL,
  apellido_paterno TEXT NOT NULL,
  apellido_materno TEXT,
  rol             public.rol_usuario NOT NULL DEFAULT 'docente',
  colegio_id      UUID REFERENCES gestion.colegio(id) ON DELETE SET NULL,
  docente_id      UUID REFERENCES gestion.docente(id) ON DELETE SET NULL,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acceso   TIMESTAMPTZ,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usuario_email ON public.usuario(email);
CREATE INDEX idx_usuario_rol ON public.usuario(rol);
CREATE INDEX idx_usuario_colegio ON public.usuario(colegio_id);

-- Trigger simple para actualizado_en
CREATE OR REPLACE FUNCTION public.touch_usuario_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER usuario_touch BEFORE UPDATE ON public.usuario
  FOR EACH ROW EXECUTE FUNCTION public.touch_usuario_actualizado_en();

-- Usuario admin inicial (password: 'ceis2026' hasheado con bcrypt)
-- Generado con: passlib.context.CryptContext(schemes=["bcrypt"], deprecated="auto").hash("ceis2026")
INSERT INTO public.usuario (email, password_hash, nombres, apellido_paterno, rol, activo)
VALUES (
  'admin@ceis.cl',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I1O',
  'Administrador',
  'CEIS',
  'admin',
  TRUE
)
ON CONFLICT (email) DO NOTHING;
