-- ============================================================
-- Módulo de Historias Clínicas - Multi-Tenant (Regulación 2026)
-- ============================================================

-- ─── 1. CATÁLOGOS GLOBALES (CIE-10 / CUPS) ─────────────────
CREATE TABLE IF NOT EXISTS catalogo_cie10 (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo      TEXT UNIQUE NOT NULL,
  descripcion TEXT NOT NULL,
  activo      BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS catalogo_cups (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo      TEXT UNIQUE NOT NULL,
  descripcion TEXT NOT NULL,
  activo      BOOLEAN DEFAULT true
);

ALTER TABLE catalogo_cie10 ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_cups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_cie10" ON catalogo_cie10 FOR SELECT USING (activo = true);
CREATE POLICY "public_read_cups" ON catalogo_cups FOR SELECT USING (activo = true);

-- ─── 2. TABLAS CLINICAS DE NEGOCIO (MULTI-TENANT) ──────────

CREATE TABLE IF NOT EXISTS pacientes (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id        UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  documento        TEXT NOT NULL,
  tipo_documento   TEXT DEFAULT 'CC',
  nombres          TEXT NOT NULL,
  apellidos        TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  genero           TEXT,
  telefono         TEXT,
  email            TEXT,
  direccion        TEXT,
  eps              TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, documento)
);

CREATE TABLE IF NOT EXISTS historias_clinicas (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id            UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  paciente_id          UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  medico_id            UUID REFERENCES auth.users(id) NOT NULL,
  estado               TEXT CHECK (estado IN ('borrador','cerrado')) DEFAULT 'borrador',
  enfermedad_actual    TEXT, -- Encriptado AES-256-GCM
  motivo_consulta      TEXT, -- Encriptado
  anamnesis            TEXT, -- Encriptado
  plan_manejo          TEXT, -- Encriptado
  impresion_diagnostica JSONB DEFAULT '[]'::jsonb, -- RIPS 2026
  procedimientos       JSONB DEFAULT '[]'::jsonb, -- RIPS 2026
  facturacion          JSONB DEFAULT '{}'::jsonb, -- RIPS 2026
  snapshot_demografico JSONB,
  parent_id            UUID REFERENCES historias_clinicas(id) ON DELETE RESTRICT, -- Para notas aclaratorias
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  closed_at            TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS logs_auditoria (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  usuario_id  UUID REFERENCES auth.users(id),
  accion      TEXT NOT NULL,
  entidad     TEXT NOT NULL,
  entidad_id  UUID,
  detalles    TEXT,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. ROW LEVEL SECURITY (RLS) MULTI-TENANT ───────────────

ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE historias_clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

-- Pacientes: Solo leídos y escritos por el tenant
CREATE POLICY "tenant_read_pacientes" ON pacientes FOR SELECT
  USING (tenant_id = get_tenant_id() OR is_superadmin());

CREATE POLICY "tenant_write_pacientes" ON pacientes FOR ALL
  USING (tenant_id = get_tenant_id() OR is_superadmin());

-- Historias Clínicas: Solo leídos y escritos por el tenant (el backend validará que el auth.uid() coincida o delegará a roles específicos)
CREATE POLICY "tenant_read_historias" ON historias_clinicas FOR SELECT
  USING (tenant_id = get_tenant_id() OR is_superadmin());

CREATE POLICY "tenant_write_historias" ON historias_clinicas FOR ALL
  USING (tenant_id = get_tenant_id() OR is_superadmin());

-- Logs: Solo escritura para la app, lectura solo admin
CREATE POLICY "tenant_write_logs" ON logs_auditoria FOR INSERT
  WITH CHECK (tenant_id = get_tenant_id() OR is_superadmin());

CREATE POLICY "tenant_read_logs" ON logs_auditoria FOR SELECT
  USING (tenant_id = get_tenant_id() OR is_superadmin());

-- ─── 4. TRIGGERS: Inalterabilidad y Updated_at ───────────────

CREATE OR REPLACE FUNCTION update_updated_at_clinicas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pacientes_updated
  BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_clinicas();

CREATE TRIGGER trg_historias_updated
  BEFORE UPDATE ON historias_clinicas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_clinicas();

-- Trigger de Inalterabilidad
CREATE OR REPLACE FUNCTION check_inalterabilidad()
RETURNS TRIGGER AS $$
BEGIN
  -- Impedir UPDATE si la historia ya estaba cerrada en la DB (OLD.estado = 'cerrado')
  -- Y la operación actual es un UPDATE (no permite transiciones desde 'cerrado' a otra cosa)
  IF (TG_OP = 'UPDATE') THEN
    IF OLD.estado = 'cerrado' THEN
      RAISE EXCEPTION 'Operación denegada: Un folio clínico cerrado es inalterable por ley.';
    END IF;
  END IF;

  -- Impedir DELETE totalmente si la historia está cerrada
  IF (TG_OP = 'DELETE') THEN
    IF OLD.estado = 'cerrado' THEN
      RAISE EXCEPTION 'Operación denegada: Un folio clínico cerrado no puede ser eliminado por ley.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asociar el trigger para UPDATE y DELETE en historias clínicas
CREATE TRIGGER trg_check_inalterabilidad
  BEFORE UPDATE OR DELETE ON historias_clinicas
  FOR EACH ROW EXECUTE FUNCTION check_inalterabilidad();
