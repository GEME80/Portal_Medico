-- ============================================================
-- MIGRACIÓN: 20260916120000_permisos_administrativos.sql
-- AGENTE: DBA Custodian & DevSecOps Lead
-- FECHA: 2026-09-16
-- DESCRIPCIÓN: Extensión de miembros_equipo con permisos JSONB,
--              metadatos de usuario y segregación RLS para
--              bloqueo de actos médicos a personal administrativo.
-- ============================================================

-- UP: Aplicar cambio
ALTER TABLE miembros_equipo
  ADD COLUMN IF NOT EXISTS nombre TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS permisos JSONB NOT NULL DEFAULT '{"citas": true, "pacientes_demograficos": true, "inventario": false, "noticias": false}'::jsonb,
  ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS creado_por UUID REFERENCES auth.users(id);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_miembros_equipo_tenant_user ON miembros_equipo(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_miembros_equipo_email ON miembros_equipo(tenant_id, email);

-- Función helper para verificar el rol del usuario en el tenant
CREATE OR REPLACE FUNCTION get_user_tenant_role(p_tenant_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_rol TEXT;
BEGIN
  SELECT rol INTO v_rol
  FROM miembros_equipo
  WHERE tenant_id = p_tenant_id AND user_id = p_user_id AND activo = true
  LIMIT 1;

  RETURN COALESCE(v_rol, 'paciente');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Ajuste de políticas RLS en historias_clinicas:
-- El personal con rol 'recepcion' NO debe poder consultar ni escribir historias clínicas
DROP POLICY IF EXISTS "tenant_read_historias" ON historias_clinicas;
CREATE POLICY "tenant_read_historias" ON historias_clinicas FOR SELECT
  USING (
    (tenant_id = get_tenant_id() OR is_superadmin())
    AND (
      is_superadmin()
      OR NOT EXISTS (
        SELECT 1 FROM miembros_equipo me
        WHERE me.tenant_id = historias_clinicas.tenant_id
          AND me.user_id = auth.uid()
          AND me.rol = 'recepcion'
      )
    )
  );

DROP POLICY IF EXISTS "tenant_write_historias" ON historias_clinicas;
CREATE POLICY "tenant_write_historias" ON historias_clinicas FOR ALL
  USING (
    (tenant_id = get_tenant_id() OR is_superadmin())
    AND (
      is_superadmin()
      OR NOT EXISTS (
        SELECT 1 FROM miembros_equipo me
        WHERE me.tenant_id = historias_clinicas.tenant_id
          AND me.user_id = auth.uid()
          AND me.rol = 'recepcion'
      )
    )
  );

-- DOWN: Revertir cambio
/*
DROP POLICY IF EXISTS "tenant_read_historias" ON historias_clinicas;
CREATE POLICY "tenant_read_historias" ON historias_clinicas FOR SELECT
  USING (tenant_id = get_tenant_id() OR is_superadmin());

DROP POLICY IF EXISTS "tenant_write_historias" ON historias_clinicas;
CREATE POLICY "tenant_write_historias" ON historias_clinicas FOR ALL
  USING (tenant_id = get_tenant_id() OR is_superadmin());

DROP FUNCTION IF EXISTS get_user_tenant_role(UUID, UUID);
DROP INDEX IF EXISTS idx_miembros_equipo_email;
DROP INDEX IF EXISTS idx_miembros_equipo_tenant_user;

ALTER TABLE miembros_equipo
  DROP COLUMN IF EXISTS creado_por,
  DROP COLUMN IF EXISTS activo,
  DROP COLUMN IF EXISTS permisos,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS nombre;
*/

-- IMPACT_ESTIMATE:
-- · Tablas afectadas: [miembros_equipo (ALTER), historias_clinicas (RLS POLICIES)]
-- · Filas estimadas: 0-100
-- · Bloqueos: Breve bloqueo exclusivo DDL durante adición de columnas
-- · Tiempo estimado de ejecución: < 500ms
-- · Downtime requerido: Ninguno (Zero-Downtime compatible)
-- · Aprobación requerida: Agente Principal / DBA Custodian
