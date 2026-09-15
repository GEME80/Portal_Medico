-- ============================================================
-- MIGRACIÓN: [20260915103000_configuracion_agenda.sql]
-- AGENTE: DBA Custodian & Principal Platform Architect | FECHA: 2026-09-15
-- ============================================================

-- UP: Aplicar cambio

-- 1. Asegurar estados y políticas de auto-confirmación directa en citas_medicas
DO $$
BEGIN
  -- Permitir que las reservas públicas directas se creen con estado 'confirmada'
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'public_request_cita' AND tablename = 'citas_medicas'
  ) THEN
    DROP POLICY "public_request_cita" ON citas_medicas;
  END IF;
END $$;

CREATE POLICY "public_insert_citas" ON citas_medicas FOR INSERT
  WITH CHECK (tipo = 'cita' AND estado IN ('solicitada', 'confirmada'));

-- 2. Tabla de Configuración de Agenda por Consultorio
CREATE TABLE IF NOT EXISTS configuracion_agenda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE NOT NULL,
  duracion_cita_minutos INTEGER DEFAULT 30 CHECK (duracion_cita_minutos IN (15, 20, 30, 45, 60)),
  buffer_minutos INTEGER DEFAULT 0 CHECK (buffer_minutos >= 0),
  dias_laborales JSONB DEFAULT '{
    "1": {"activo": true, "inicio": "08:00", "fin": "17:00", "receso_inicio": "12:00", "receso_fin": "13:00"},
    "2": {"activo": true, "inicio": "08:00", "fin": "17:00", "receso_inicio": "12:00", "receso_fin": "13:00"},
    "3": {"activo": true, "inicio": "08:00", "fin": "17:00", "receso_inicio": "12:00", "receso_fin": "13:00"},
    "4": {"activo": true, "inicio": "08:00", "fin": "17:00", "receso_inicio": "12:00", "receso_fin": "13:00"},
    "5": {"activo": true, "inicio": "08:00", "fin": "17:00", "receso_inicio": "12:00", "receso_fin": "13:00"},
    "6": {"activo": true, "inicio": "08:00", "fin": "12:00"},
    "0": {"activo": false, "inicio": "08:00", "fin": "12:00"}
  }'::jsonb,
  auto_confirmar BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE configuracion_agenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_configuracion_agenda" ON configuracion_agenda FOR SELECT
  USING (true);

CREATE POLICY "tenant_write_configuracion_agenda" ON configuracion_agenda FOR ALL
  USING (tenant_id = get_tenant_id() OR is_superadmin());

-- DOWN: Revertir cambio
-- DROP TABLE IF EXISTS configuracion_agenda;
