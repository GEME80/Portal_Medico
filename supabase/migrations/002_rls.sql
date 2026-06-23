-- ============================================================
-- EcoVaccine Platform — Row Level Security (RLS)
-- Ejecutar DESPUÉS de 001_schema.sql
-- ============================================================

-- ─── FUNCIONES HELPER ───────────────────────────────────────

-- Obtiene el tenant_id del JWT del usuario autenticado
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID AS $$
  SELECT ((auth.jwt() -> 'app_metadata') ->> 'tenant_id')::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Verifica si el usuario es superadmin (gerkof@gmail.com)
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT ((auth.jwt() -> 'app_metadata') ->> 'role') = 'superadmin';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─── HABILITAR RLS EN TODAS LAS TABLAS ──────────────────────
ALTER TABLE tenants                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_portal     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineas_investigacion     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitos_timeline           ENABLE ROW LEVEL SECURITY;
ALTER TABLE noticias_posts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE mitos_vacunales          ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_vacunas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_vacunas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes_vacunas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_epidemiologicas  ENABLE ROW LEVEL SECURITY;

-- ─── TENANTS ─────────────────────────────────────────────────
-- Solo superadmin puede ver/gestionar todos los tenants
CREATE POLICY "superadmin_all_tenants" ON tenants
  FOR ALL USING (is_superadmin());

-- Cualquiera puede leer tenants activos (para validar slugs en middleware)
CREATE POLICY "public_read_active_tenants" ON tenants
  FOR SELECT USING (activo = true);

-- ─── CONFIGURACIÓN DEL PORTAL ────────────────────────────────
-- Lectura pública (el portal público necesita leer la config sin auth)
CREATE POLICY "public_read_config" ON configuracion_portal
  FOR SELECT USING (true);

-- Solo el admin del tenant o superadmin puede escribir
CREATE POLICY "tenant_write_config" ON configuracion_portal
  FOR ALL USING (
    tenant_id = get_tenant_id()
    OR is_superadmin()
  );

-- ─── LÍNEAS DE INVESTIGACIÓN ─────────────────────────────────
CREATE POLICY "public_read_lineas" ON lineas_investigacion
  FOR SELECT USING (activo = true);

CREATE POLICY "tenant_write_lineas" ON lineas_investigacion
  FOR ALL USING (tenant_id = get_tenant_id() OR is_superadmin());

-- ─── HITOS TIMELINE ──────────────────────────────────────────
CREATE POLICY "public_read_hitos" ON hitos_timeline
  FOR SELECT USING (true);

CREATE POLICY "tenant_write_hitos" ON hitos_timeline
  FOR ALL USING (tenant_id = get_tenant_id() OR is_superadmin());

-- ─── NOTICIAS / CMS ──────────────────────────────────────────
-- Solo posts publicados son públicos
CREATE POLICY "public_read_noticias" ON noticias_posts
  FOR SELECT USING (publicado = true);

-- El admin del tenant ve y edita todo (incluidos borradores)
CREATE POLICY "tenant_all_noticias" ON noticias_posts
  FOR ALL USING (tenant_id = get_tenant_id() OR is_superadmin());

-- ─── MITOS VACUNALES ─────────────────────────────────────────
CREATE POLICY "public_read_mitos" ON mitos_vacunales
  FOR SELECT USING (activo = true);

CREATE POLICY "tenant_write_mitos" ON mitos_vacunales
  FOR ALL USING (tenant_id = get_tenant_id() OR is_superadmin());

-- ─── INVENTARIO VACUNAS ──────────────────────────────────────
-- Privado: solo el tenant y superadmin
CREATE POLICY "tenant_all_vacunas" ON inventario_vacunas
  FOR ALL USING (tenant_id = get_tenant_id() OR is_superadmin());

-- ─── MOVIMIENTOS DE VACUNAS ──────────────────────────────────
CREATE POLICY "tenant_all_movimientos" ON movimientos_vacunas
  FOR ALL USING (tenant_id = get_tenant_id() OR is_superadmin());

-- ─── LOTES DE VACUNAS ────────────────────────────────────────
CREATE POLICY "tenant_all_lotes" ON lotes_vacunas
  FOR ALL USING (tenant_id = get_tenant_id() OR is_superadmin());

-- ─── ALERTAS EPIDEMIOLÓGICAS ─────────────────────────────────
-- Las alertas activas son públicas
CREATE POLICY "public_read_alertas" ON alertas_epidemiologicas
  FOR SELECT USING (activa = true);

CREATE POLICY "tenant_write_alertas" ON alertas_epidemiologicas
  FOR ALL USING (tenant_id = get_tenant_id() OR is_superadmin());
