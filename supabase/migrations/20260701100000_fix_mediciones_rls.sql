-- Eliminar las politicas incorrectas
DROP POLICY IF EXISTS "Mediciones tenant-isolated SELECT" ON public.paciente_mediciones_antropometricas;
DROP POLICY IF EXISTS "Mediciones tenant-isolated INSERT" ON public.paciente_mediciones_antropometricas;
DROP POLICY IF EXISTS "Mediciones tenant-isolated UPDATE" ON public.paciente_mediciones_antropometricas;
DROP POLICY IF EXISTS "Mediciones tenant-isolated DELETE" ON public.paciente_mediciones_antropometricas;

-- Usar las funciones centralizadas get_tenant_id() e is_superadmin()
CREATE POLICY "tenant_read_mediciones" ON public.paciente_mediciones_antropometricas FOR SELECT
  USING (tenant_id = get_tenant_id() OR is_superadmin());

CREATE POLICY "tenant_write_mediciones" ON public.paciente_mediciones_antropometricas FOR ALL
  USING (tenant_id = get_tenant_id() OR is_superadmin());
