-- ============================================================
-- MIGRACIÓN: [20260914095400_performance_indexes.sql]
-- AGENTE: DBA Custodian | FECHA: 2026-09-14
-- ============================================================

-- UP: Aplicar cambio
CREATE INDEX IF NOT EXISTS idx_pacientes_tenant_doc ON pacientes(tenant_id, documento);
CREATE INDEX IF NOT EXISTS idx_historias_tenant_paciente_fecha ON historias_clinicas(tenant_id, paciente_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_historias_diagnosticos_gin ON historias_clinicas USING GIN (impresion_diagnostica);

-- DOWN: Revertir cambio
DROP INDEX IF EXISTS idx_historias_diagnosticos_gin;
DROP INDEX IF EXISTS idx_historias_tenant_paciente_fecha;
DROP INDEX IF EXISTS idx_pacientes_tenant_doc;

-- IMPACT_ESTIMATE:
-- · Tablas afectadas: [pacientes, historias_clinicas]
-- · Filas estimadas: [0]
-- · Bloqueos: [Compartido]
-- · Tiempo estimado de ejecución: [< 500ms]
-- · Aprobación requerida: [Automática]
