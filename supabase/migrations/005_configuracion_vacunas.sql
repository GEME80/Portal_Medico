-- ============================================================
-- EcoVaccine Platform — Migración: Personalización de Vacunas y Bucket de Almacenamiento
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Agregar columnas a la tabla configuracion_portal
ALTER TABLE configuracion_portal ADD COLUMN IF NOT EXISTS habilitar_menu_vacunas BOOLEAN DEFAULT true;
ALTER TABLE configuracion_portal ADD COLUMN IF NOT EXISTS nombre_menu_vacunas TEXT DEFAULT 'EcoVaccine';
ALTER TABLE configuracion_portal ADD COLUMN IF NOT EXISTS vacunas_hero_titulo TEXT DEFAULT 'Vacunas seguras, niños protegidos';
ALTER TABLE configuracion_portal ADD COLUMN IF NOT EXISTS vacunas_hero_subtitulo TEXT DEFAULT 'EcoVaccine — Vacunación Basada en Evidencia';
ALTER TABLE configuracion_portal ADD COLUMN IF NOT EXISTS vacunas_hero_descripcion TEXT DEFAULT 'El doctor responde con evidencia científica los mitos más comunes sobre la vacunación.';
ALTER TABLE configuracion_portal ADD COLUMN IF NOT EXISTS vacunas_mitos_titulo TEXT DEFAULT 'Decodificador de Mitos Vacunales';
ALTER TABLE configuracion_portal ADD COLUMN IF NOT EXISTS vacunas_inventario_titulo TEXT DEFAULT 'Vacunas Disponibles y Esquemas de Aplicación';

-- 2. Crear bucket público 'portal-media' en storage.buckets si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('portal-media', 'portal-media', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Crear políticas RLS en storage.objects para el bucket 'portal-media'
DROP POLICY IF EXISTS "Lectura publica bucket portal-media" ON storage.objects;
DROP POLICY IF EXISTS "Subida autenticada bucket portal-media" ON storage.objects;
DROP POLICY IF EXISTS "Modificacion autenticada bucket portal-media" ON storage.objects;
DROP POLICY IF EXISTS "Borrado autenticado bucket portal-media" ON storage.objects;

-- Permitir lectura pública de objetos en el bucket 'portal-media'
CREATE POLICY "Lectura publica bucket portal-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'portal-media');

-- Permitir subida de archivos a usuarios autenticados
CREATE POLICY "Subida autenticada bucket portal-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'portal-media');

-- Permitir modificar archivos a usuarios autenticados
CREATE POLICY "Modificacion autenticada bucket portal-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'portal-media')
WITH CHECK (bucket_id = 'portal-media');

-- Permitir borrar archivos a usuarios autenticados
CREATE POLICY "Borrado autenticado bucket portal-media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'portal-media');
