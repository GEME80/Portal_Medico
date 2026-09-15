-- ============================================================
-- MIGRACIÓN: [20260914104000_citas_y_carne.sql]
-- AGENTE: DBA Custodian | FECHA: 2026-09-14
-- ============================================================

-- UP: Aplicar cambio

-- 1. Token de acceso para Carné Digital en tabla Pacientes
-- Habilitamos la extensión pgcrypto si no existe (ya viene por defecto en Supabase, pero usamos gen_random_uuid)
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS token_acceso UUID DEFAULT gen_random_uuid() UNIQUE;

-- 2. Tabla de Citas Médicas y Bloqueos de Agenda
CREATE TABLE IF NOT EXISTS citas_medicas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE SET NULL,
  medico_id UUID REFERENCES auth.users(id),
  tipo TEXT CHECK (tipo IN ('cita', 'bloqueo')) DEFAULT 'cita',
  estado TEXT CHECK (estado IN ('solicitada', 'programada', 'confirmada', 'cancelada', 'completada', 'bloqueada')) DEFAULT 'programada',
  fecha_hora TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ,
  duracion_minutos INTEGER DEFAULT 30,
  motivo TEXT,
  notas TEXT,
  nombre_solicitante TEXT,
  documento_solicitante TEXT,
  telefono_solicitante TEXT,
  email_solicitante TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_citas_tenant_fecha ON citas_medicas(tenant_id, fecha_hora);

ALTER TABLE citas_medicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read_citas" ON citas_medicas FOR SELECT
  USING (tenant_id = get_tenant_id() OR is_superadmin());

CREATE POLICY "tenant_write_citas" ON citas_medicas FOR ALL
  USING (tenant_id = get_tenant_id() OR is_superadmin());

-- Permitir que pacientes del portal público inserten su solicitud de cita
CREATE POLICY "public_request_cita" ON citas_medicas FOR INSERT
  WITH CHECK (tipo = 'cita' AND estado = 'solicitada');

CREATE TRIGGER trg_citas_updated
  BEFORE UPDATE ON citas_medicas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_clinicas();

-- 3. Tabla de Miembros de Equipo (Gestión de Roles)
CREATE TABLE IF NOT EXISTS miembros_equipo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rol TEXT CHECK (rol IN ('admin', 'medico', 'recepcion')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

ALTER TABLE miembros_equipo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read_equipo" ON miembros_equipo FOR SELECT
  USING (tenant_id = get_tenant_id() OR is_superadmin());

CREATE POLICY "tenant_write_equipo" ON miembros_equipo FOR ALL
  USING (tenant_id = get_tenant_id() OR is_superadmin());


-- DOWN: Revertir cambio
DROP TABLE IF EXISTS miembros_equipo;
DROP TABLE IF EXISTS citas_medicas;
ALTER TABLE pacientes DROP COLUMN IF EXISTS token_acceso;

-- IMPACT_ESTIMATE:
-- · Tablas afectadas: [pacientes (ALTER), citas_medicas (NEW), miembros_equipo (NEW)]
-- · Filas estimadas: [0]
-- · Bloqueos: [Compartido sobre pacientes]
-- · Tiempo estimado de ejecución: [< 500ms]
-- · Aprobación requerida: [Automática]
