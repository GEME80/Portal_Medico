CREATE TABLE IF NOT EXISTS oms_antropometria_infantil_0_24m (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    genero TEXT NOT NULL,
    meses INTEGER NOT NULL,
    parametro TEXT NOT NULL,
    p3 DECIMAL NOT NULL,
    p15 DECIMAL NOT NULL,
    p50 DECIMAL NOT NULL,
    p85 DECIMAL NOT NULL,
    p97 DECIMAL NOT NULL
);

CREATE TABLE IF NOT EXISTS oms_antropometria_ninos_2_5a (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    genero TEXT NOT NULL,
    meses INTEGER NOT NULL,
    parametro TEXT NOT NULL,
    p3 DECIMAL NOT NULL,
    p15 DECIMAL NOT NULL,
    p50 DECIMAL NOT NULL,
    p85 DECIMAL NOT NULL,
    p97 DECIMAL NOT NULL
);

-- Limpiar data si existe (para re-inyectar)
TRUNCATE TABLE oms_antropometria_infantil_0_24m;
TRUNCATE TABLE oms_antropometria_ninos_2_5a;

-- Data Mock Base: Peso para Niños (M) 0-24m (Simulación lineal simple)
INSERT INTO oms_antropometria_infantil_0_24m (genero, meses, parametro, p3, p15, p50, p85, p97)
SELECT 
    'M', 
    v, 
    'peso',
    3.0 + (v * 0.3),  -- p3 aprox
    3.2 + (v * 0.35), -- p15 aprox
    3.5 + (v * 0.4),  -- p50 aprox
    3.9 + (v * 0.45), -- p85 aprox
    4.2 + (v * 0.5)   -- p97 aprox
FROM generate_series(0, 24) as v;

-- Data Mock Base: Peso para Niñas (F) 0-24m
INSERT INTO oms_antropometria_infantil_0_24m (genero, meses, parametro, p3, p15, p50, p85, p97)
SELECT 
    'F', 
    v, 
    'peso',
    2.8 + (v * 0.28), 
    3.0 + (v * 0.32), 
    3.2 + (v * 0.38), 
    3.6 + (v * 0.42), 
    3.9 + (v * 0.48)
FROM generate_series(0, 24) as v;

-- Data Mock Base: Talla para Niños (M) 0-24m
INSERT INTO oms_antropometria_infantil_0_24m (genero, meses, parametro, p3, p15, p50, p85, p97)
SELECT 'M', v, 'talla', 48.0 + (v * 1.0), 49.0 + (v * 1.1), 50.0 + (v * 1.2), 51.0 + (v * 1.3), 52.0 + (v * 1.4) FROM generate_series(0, 24) as v;

-- Data Mock Base: Talla para Niñas (F) 0-24m
INSERT INTO oms_antropometria_infantil_0_24m (genero, meses, parametro, p3, p15, p50, p85, p97)
SELECT 'F', v, 'talla', 47.0 + (v * 1.0), 48.0 + (v * 1.1), 49.0 + (v * 1.2), 50.0 + (v * 1.3), 51.0 + (v * 1.4) FROM generate_series(0, 24) as v;


-- Para 2 a 5 años (24 a 60 meses)
-- Peso Niños
INSERT INTO oms_antropometria_ninos_2_5a (genero, meses, parametro, p3, p15, p50, p85, p97)
SELECT 'M', v, 'peso', 10.0 + ((v-24) * 0.15), 11.0 + ((v-24) * 0.17), 12.0 + ((v-24) * 0.2), 13.5 + ((v-24) * 0.23), 15.0 + ((v-24) * 0.26) FROM generate_series(24, 60) as v;

-- Peso Niñas
INSERT INTO oms_antropometria_ninos_2_5a (genero, meses, parametro, p3, p15, p50, p85, p97)
SELECT 'F', v, 'peso', 9.5 + ((v-24) * 0.14), 10.5 + ((v-24) * 0.16), 11.5 + ((v-24) * 0.19), 13.0 + ((v-24) * 0.22), 14.5 + ((v-24) * 0.25) FROM generate_series(24, 60) as v;

-- Talla Niños
INSERT INTO oms_antropometria_ninos_2_5a (genero, meses, parametro, p3, p15, p50, p85, p97)
SELECT 'M', v, 'talla', 84.0 + ((v-24) * 0.5), 85.5 + ((v-24) * 0.55), 87.0 + ((v-24) * 0.6), 89.0 + ((v-24) * 0.65), 91.0 + ((v-24) * 0.7) FROM generate_series(24, 60) as v;

-- Talla Niñas
INSERT INTO oms_antropometria_ninos_2_5a (genero, meses, parametro, p3, p15, p50, p85, p97)
SELECT 'F', v, 'talla', 83.0 + ((v-24) * 0.5), 84.5 + ((v-24) * 0.55), 86.0 + ((v-24) * 0.6), 88.0 + ((v-24) * 0.65), 90.0 + ((v-24) * 0.7) FROM generate_series(24, 60) as v;
