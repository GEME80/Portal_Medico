-- ============================================================
-- MIGRACIÓN: [20260914100000_rename_ecovaccine.sql]
-- AGENTE: DBA Custodian | FECHA: 2026-09-14
-- ============================================================

-- UP: Aplicar cambio
-- Cambiar la categoría 'EcoVaccine' a 'HubMed' en registros existentes (si los hay)
UPDATE noticias_posts SET categoria = 'HubMed' WHERE categoria = 'EcoVaccine';

-- Recrear el CHECK constraint
ALTER TABLE noticias_posts DROP CONSTRAINT IF EXISTS noticias_posts_categoria_check;
ALTER TABLE noticias_posts ADD CONSTRAINT noticias_posts_categoria_check 
  CHECK (categoria IN ('Académico','Prevención','Epidemiología','HubMed'));

-- DOWN: Revertir cambio
UPDATE noticias_posts SET categoria = 'EcoVaccine' WHERE categoria = 'HubMed';

ALTER TABLE noticias_posts DROP CONSTRAINT IF EXISTS noticias_posts_categoria_check;
ALTER TABLE noticias_posts ADD CONSTRAINT noticias_posts_categoria_check 
  CHECK (categoria IN ('Académico','Prevención','Epidemiología','EcoVaccine'));

-- IMPACT_ESTIMATE:
-- · Tablas afectadas: [noticias_posts]
-- · Filas estimadas: [0 - N]
-- · Bloqueos: [Exclusivo sobre tabla noticias_posts durante ALTER]
-- · Tiempo estimado de ejecución: [< 500ms]
-- · Aprobación requerida: [Automática]
