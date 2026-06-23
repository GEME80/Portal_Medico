-- ============================================================
-- EcoVaccine Platform — Migración: Gestión de Dominios, Pagos y Plantillas
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Agregar columnas a la tabla tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS estado_pago TEXT DEFAULT 'activo' CHECK (estado_pago IN ('activo','mora','suspendido'));
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS template_id TEXT DEFAULT 'standard';

-- 2. Asegurarse de que el RLS permita al superadmin ver y editar estas columnas
-- Las políticas existentes en 002_rls.sql ya usan `is_superadmin()` para ALL operations en `tenants`.
-- Por lo tanto, no se requieren políticas adicionales.
