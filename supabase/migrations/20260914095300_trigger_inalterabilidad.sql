-- ============================================================
-- MIGRACIÓN: [20260914095300_trigger_inalterabilidad.sql]
-- AGENTE: DBA Custodian | FECHA: 2026-09-14
-- ============================================================

-- UP: Aplicar cambio
-- Ampliar los estados permitidos y añadir motivo_aclaratoria para soportar notas aclaratorias
ALTER TABLE historias_clinicas DROP CONSTRAINT IF EXISTS historias_clinicas_estado_check;
ALTER TABLE historias_clinicas ADD CONSTRAINT historias_clinicas_estado_check CHECK (estado IN ('borrador', 'cerrado', 'aclaratoria'));
ALTER TABLE historias_clinicas ADD COLUMN IF NOT EXISTS motivo_aclaratoria TEXT;

-- Reemplazar el trigger para ser aún más restrictivo
-- Garantizando que la inalterabilidad sea absoluta y cubra 'aclaratoria'.
CREATE OR REPLACE FUNCTION check_inalterabilidad()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF OLD.estado = 'cerrado' OR OLD.estado = 'aclaratoria' THEN
      RAISE EXCEPTION 'Operación denegada: Un folio clínico cerrado o nota aclaratoria es inalterable por ley.';
    END IF;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    IF OLD.estado = 'cerrado' OR OLD.estado = 'aclaratoria' THEN
      RAISE EXCEPTION 'Operación denegada: Un folio clínico cerrado o nota aclaratoria no puede ser eliminado por ley.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- DOWN: Revertir cambio
ALTER TABLE historias_clinicas DROP COLUMN IF EXISTS motivo_aclaratoria;
ALTER TABLE historias_clinicas DROP CONSTRAINT IF EXISTS historias_clinicas_estado_check;
ALTER TABLE historias_clinicas ADD CONSTRAINT historias_clinicas_estado_check CHECK (estado IN ('borrador', 'cerrado'));

CREATE OR REPLACE FUNCTION check_inalterabilidad()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF OLD.estado = 'cerrado' THEN
      RAISE EXCEPTION 'Operación denegada: Un folio clínico cerrado es inalterable por ley.';
    END IF;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    IF OLD.estado = 'cerrado' THEN
      RAISE EXCEPTION 'Operación denegada: Un folio clínico cerrado no puede ser eliminado por ley.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- IMPACT_ESTIMATE:
-- · Tablas afectadas: [historias_clinicas]
-- · Filas estimadas: [0]
-- · Bloqueos: [Exclusivo sobre tabla historias_clinicas durante ALTER TABLE]
-- · Tiempo estimado de ejecución: [< 100ms]
-- · Aprobación requerida: [Automática]
