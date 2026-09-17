-- ============================================================
-- MIGRACIÓN: [20260916170000_aplicaciones_vacunas.sql]
-- DESCRIPCIÓN: Registro de aplicaciones de vacunas por paciente
--              para Carné de Vacunación Digital y trazabilidad
-- ============================================================

-- 1. Tabla de Aplicaciones de Vacunas
CREATE TABLE IF NOT EXISTS aplicaciones_vacunas (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id             UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  paciente_id           UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  vacuna_id             UUID REFERENCES inventario_medico(id) ON DELETE SET NULL,
  nombre_vacuna         TEXT NOT NULL,
  enfermedad_prevenida  TEXT DEFAULT '',
  dosis                 TEXT NOT NULL, -- Ej: '1ra Dosis', '2da Dosis', '3ra Dosis', 'Refuerzo 1', 'Refuerzo 2', 'Única', 'Anual'
  edad_aplicacion       TEXT DEFAULT '', -- Ej: 'Recién Nacido', '2 Meses', '4 Meses', '6 Meses', '12 Meses', '18 Meses', '5 Años'
  fecha_aplicacion      DATE NOT NULL DEFAULT CURRENT_DATE,
  numero_lote           TEXT DEFAULT '',
  laboratorio           TEXT DEFAULT '',
  via_administracion    TEXT DEFAULT 'Intramuscular',
  sitio_aplicacion      TEXT DEFAULT '', -- Ej: 'Deltoides derecho', 'Vasto lateral muslo'
  profesional_nombre    TEXT DEFAULT '',
  origen                TEXT CHECK (origen IN ('institucional', 'externo')) DEFAULT 'institucional',
  observaciones         TEXT DEFAULT '',
  proxima_cita_sugerida DATE,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- 2. Índices de Búsqueda Rápida
CREATE INDEX IF NOT EXISTS idx_aplicaciones_paciente ON aplicaciones_vacunas(paciente_id, fecha_aplicacion DESC);
CREATE INDEX IF NOT EXISTS idx_aplicaciones_tenant ON aplicaciones_vacunas(tenant_id);

-- 3. Row Level Security (RLS)
ALTER TABLE aplicaciones_vacunas ENABLE ROW LEVEL SECURITY;

-- Política para personal del consultorio autenticado (Médico / Recepción / Admin)
DROP POLICY IF EXISTS "tenant_all_aplicaciones_vacunas" ON aplicaciones_vacunas;
CREATE POLICY "tenant_all_aplicaciones_vacunas" ON aplicaciones_vacunas FOR ALL
  USING (tenant_id = get_tenant_id() OR is_superadmin());

-- Política de lectura pública para el Carné Digital (validado a través de pacientes con token_acceso)
DROP POLICY IF EXISTS "public_read_aplicaciones_vacunas" ON aplicaciones_vacunas;
CREATE POLICY "public_read_aplicaciones_vacunas" ON aplicaciones_vacunas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pacientes p
      WHERE p.id = aplicaciones_vacunas.paciente_id
        AND p.token_acceso IS NOT NULL
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_aplicaciones_vacunas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_aplicaciones_vacunas_updated ON aplicaciones_vacunas;
CREATE TRIGGER trg_aplicaciones_vacunas_updated
  BEFORE UPDATE ON aplicaciones_vacunas
  FOR EACH ROW
  EXECUTE FUNCTION update_aplicaciones_vacunas_updated_at();
