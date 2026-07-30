ALTER TABLE public.oms_chart_calibrations
ADD COLUMN IF NOT EXISTS image_url text;
