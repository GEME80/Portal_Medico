-- ============================================================
-- Módulo de Historias Clínicas - Ajustes RIPS y Signos Vitales
-- ============================================================

-- 1. Añadir campos requeridos para RIPS y Metadatos Clínicos
ALTER TABLE historias_clinicas 
ADD COLUMN metadatos_atencion JSONB DEFAULT '{}'::jsonb;

-- 2. Añadir campos para Signos Vitales e IMC en texto plano (JSONB)
ALTER TABLE historias_clinicas 
ADD COLUMN signos_vitales JSONB DEFAULT '{}'::jsonb;
