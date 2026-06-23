-- Añadir valor_mayorista a la tabla inventario_medico
ALTER TABLE IF EXISTS inventario_medico 
ADD COLUMN IF NOT EXISTS valor_mayorista NUMERIC DEFAULT 0;
