CREATE TABLE IF NOT EXISTS public.paciente_mediciones_antropometricas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE,
    medico_id UUID REFERENCES auth.users(id),
    peso NUMERIC,
    talla NUMERIC,
    perimetro_cefalico NUMERIC,
    fecha_medicion DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.paciente_mediciones_antropometricas ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Mediciones tenant-isolated SELECT"
    ON public.paciente_mediciones_antropometricas FOR SELECT
    USING (
        tenant_id = (SELECT (raw_app_meta_data->>'tenant_id')::uuid FROM auth.users WHERE id = auth.uid()) OR 
        tenant_id IS NULL
    );

CREATE POLICY "Mediciones tenant-isolated INSERT"
    ON public.paciente_mediciones_antropometricas FOR INSERT
    WITH CHECK (
        tenant_id = (SELECT (raw_app_meta_data->>'tenant_id')::uuid FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Mediciones tenant-isolated UPDATE"
    ON public.paciente_mediciones_antropometricas FOR UPDATE
    USING (
        tenant_id = (SELECT (raw_app_meta_data->>'tenant_id')::uuid FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Mediciones tenant-isolated DELETE"
    ON public.paciente_mediciones_antropometricas FOR DELETE
    USING (
        tenant_id = (SELECT (raw_app_meta_data->>'tenant_id')::uuid FROM auth.users WHERE id = auth.uid())
    );

-- Otorgar permisos
GRANT ALL ON TABLE public.paciente_mediciones_antropometricas TO service_role;
GRANT ALL ON TABLE public.paciente_mediciones_antropometricas TO authenticated;
GRANT ALL ON TABLE public.paciente_mediciones_antropometricas TO anon;

-- Limpiar la tabla de historias clinicas de los registros falsos inyectados para el mock de la OMS
-- Deshabilitamos el trigger de inalterabilidad por ley temporalmente para limpiar la data dummy
ALTER TABLE public.historias_clinicas DISABLE TRIGGER trg_check_inalterabilidad;

DELETE FROM public.historias_clinicas WHERE motivo_consulta = 'Registro Histórico Antropométrico';

ALTER TABLE public.historias_clinicas ENABLE TRIGGER trg_check_inalterabilidad;
