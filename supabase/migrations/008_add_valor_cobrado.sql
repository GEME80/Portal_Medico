ALTER TABLE IF EXISTS movimientos_inventario
ADD COLUMN IF NOT EXISTS valor_unitario_cobrado NUMERIC DEFAULT 0;
