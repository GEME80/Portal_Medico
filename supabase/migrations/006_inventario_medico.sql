-- ============================================================
-- EcoVaccine Platform — Migración: Inventario Genérico
-- ============================================================

-- 1. Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categorias_inventario (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  nombre      TEXT NOT NULL,
  color       TEXT DEFAULT '#0ea5e9',
  activo      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para categorías
ALTER TABLE categorias_inventario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_all_categorias" ON categorias_inventario
  FOR ALL USING (tenant_id = get_tenant_id() OR is_superadmin());
CREATE POLICY "public_read_categorias" ON categorias_inventario
  FOR SELECT USING (activo = true);

-- 2. Renombrar tablas existentes
ALTER TABLE IF EXISTS inventario_vacunas RENAME TO inventario_medico;
ALTER TABLE IF EXISTS lotes_vacunas RENAME TO lotes_inventario;
ALTER TABLE IF EXISTS movimientos_vacunas RENAME TO movimientos_inventario;

-- 3. Renombrar columnas vacuna_id a item_id
ALTER TABLE IF EXISTS lotes_inventario RENAME COLUMN vacuna_id TO item_id;
ALTER TABLE IF EXISTS movimientos_inventario RENAME COLUMN vacuna_id TO item_id;

-- 4. Añadir categoria_id a inventario_medico
ALTER TABLE IF EXISTS inventario_medico ADD COLUMN categoria_id UUID REFERENCES categorias_inventario(id) ON DELETE SET NULL;

-- 5. Crear categoría por defecto "Vacunas" para los tenants existentes y asignarla
DO $$
DECLARE
  tenant RECORD;
  cat_id UUID;
BEGIN
  FOR tenant IN SELECT id FROM tenants LOOP
    -- Insertar categoria Vacunas
    INSERT INTO categorias_inventario (tenant_id, nombre, color)
    VALUES (tenant.id, 'Vacunas', '#10b981')
    RETURNING id INTO cat_id;

    -- Actualizar items existentes
    UPDATE inventario_medico SET categoria_id = cat_id WHERE tenant_id = tenant.id AND categoria_id IS NULL;
  END LOOP;
END $$;

-- 6. Actualizar políticas RLS (Renombrar para consistencia, aunque PG mantiene el OID)
-- Para inventario_medico (antes tenant_all_vacunas)
DROP POLICY IF EXISTS "tenant_all_vacunas" ON inventario_medico;
CREATE POLICY "tenant_all_inventario" ON inventario_medico
  FOR ALL USING (tenant_id = get_tenant_id() OR is_superadmin());

-- Lectura pública para inventario_medico
CREATE POLICY "public_read_inventario" ON inventario_medico
  FOR SELECT USING (true);

-- Para lotes_inventario
DROP POLICY IF EXISTS "tenant_all_lotes" ON lotes_inventario;
CREATE POLICY "tenant_all_lotes_inv" ON lotes_inventario
  FOR ALL USING (tenant_id = get_tenant_id() OR is_superadmin());

-- Para movimientos_inventario
DROP POLICY IF EXISTS "tenant_all_movimientos" ON movimientos_inventario;
CREATE POLICY "tenant_all_movimientos_inv" ON movimientos_inventario
  FOR ALL USING (tenant_id = get_tenant_id() OR is_superadmin());
