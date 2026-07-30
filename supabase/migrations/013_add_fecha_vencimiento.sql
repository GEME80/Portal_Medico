-- Add fecha_vencimiento to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS fecha_vencimiento TIMESTAMPTZ;
