CREATE TABLE IF NOT EXISTS public.oms_chart_calibrations (
    chart_id text PRIMARY KEY,
    grid_left_pct numeric NOT NULL,
    grid_bottom_pct numeric NOT NULL,
    grid_width_pct numeric NOT NULL,
    grid_height_pct numeric NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.oms_chart_calibrations ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario puede leer las calibraciones
CREATE POLICY "oms_chart_calibrations_read" ON public.oms_chart_calibrations
    FOR SELECT
    USING (true);

-- Solo los doctores (autenticados) pueden modificar
CREATE POLICY "oms_chart_calibrations_write" ON public.oms_chart_calibrations
    FOR ALL
    USING (auth.uid() IS NOT NULL);

GRANT ALL ON TABLE public.oms_chart_calibrations TO authenticated;
GRANT SELECT ON TABLE public.oms_chart_calibrations TO anon;

-- Sembrar las calibraciones que ya habíamos hecho a mano hoy
INSERT INTO public.oms_chart_calibrations (chart_id, grid_left_pct, grid_bottom_pct, grid_width_pct, grid_height_pct)
VALUES
    ('peso_talla_ninos_0_2', 7.7, 9.9, 86.1, 85.2),
    ('peso_edad_ninos_0_2', 5.6, 10.2, 91.3, 85.1)
ON CONFLICT (chart_id) DO NOTHING;
