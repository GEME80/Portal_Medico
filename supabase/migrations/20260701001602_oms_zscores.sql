CREATE TABLE IF NOT EXISTS oms_zscore_infantil_0_24m (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    genero TEXT NOT NULL,
    parametro TEXT NOT NULL,
    eje_x DECIMAL NOT NULL,
    z3 DECIMAL NOT NULL,
    z2 DECIMAL NOT NULL,
    z1 DECIMAL NOT NULL,
    z0 DECIMAL NOT NULL,
    zn1 DECIMAL NOT NULL,
    zn2 DECIMAL NOT NULL,
    zn3 DECIMAL NOT NULL
);

CREATE TABLE IF NOT EXISTS oms_zscore_ninos_2_5a (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    genero TEXT NOT NULL,
    parametro TEXT NOT NULL,
    eje_x DECIMAL NOT NULL,
    z3 DECIMAL NOT NULL,
    z2 DECIMAL NOT NULL,
    z1 DECIMAL NOT NULL,
    z0 DECIMAL NOT NULL,
    zn1 DECIMAL NOT NULL,
    zn2 DECIMAL NOT NULL,
    zn3 DECIMAL NOT NULL
);

-- Limpiar
TRUNCATE TABLE oms_zscore_infantil_0_24m;
TRUNCATE TABLE oms_zscore_ninos_2_5a;

-- ----------------- 0-24 MESES -----------------

-- Peso para Edad Niños (M) (eje_x = meses)
INSERT INTO oms_zscore_infantil_0_24m (genero, parametro, eje_x, z3, z2, z1, z0, zn1, zn2, zn3)
SELECT 'M', 'peso_edad', v,
    4.5 + (v * 0.5), 4.2 + (v * 0.45), 3.8 + (v * 0.4), 3.5 + (v * 0.35), 3.2 + (v * 0.3), 2.9 + (v * 0.25), 2.5 + (v * 0.2)
FROM generate_series(0, 24) as v;

-- Peso para Edad Niñas (F) (eje_x = meses)
INSERT INTO oms_zscore_infantil_0_24m (genero, parametro, eje_x, z3, z2, z1, z0, zn1, zn2, zn3)
SELECT 'F', 'peso_edad', v,
    4.3 + (v * 0.48), 4.0 + (v * 0.42), 3.6 + (v * 0.38), 3.3 + (v * 0.33), 3.0 + (v * 0.28), 2.7 + (v * 0.24), 2.4 + (v * 0.19)
FROM generate_series(0, 24) as v;

-- Peso para Longitud Niños (M) (eje_x = cm)
INSERT INTO oms_zscore_infantil_0_24m (genero, parametro, eje_x, z3, z2, z1, z0, zn1, zn2, zn3)
SELECT 'M', 'peso_longitud', v,
    3.0 + ((v-45) * 0.35), 2.8 + ((v-45) * 0.32), 2.6 + ((v-45) * 0.28), 2.4 + ((v-45) * 0.25), 2.2 + ((v-45) * 0.22), 2.0 + ((v-45) * 0.19), 1.8 + ((v-45) * 0.16)
FROM generate_series(45, 110) as v;

-- Peso para Longitud Niñas (F) (eje_x = cm)
INSERT INTO oms_zscore_infantil_0_24m (genero, parametro, eje_x, z3, z2, z1, z0, zn1, zn2, zn3)
SELECT 'F', 'peso_longitud', v,
    2.9 + ((v-45) * 0.33), 2.7 + ((v-45) * 0.3), 2.5 + ((v-45) * 0.26), 2.3 + ((v-45) * 0.23), 2.1 + ((v-45) * 0.2), 1.9 + ((v-45) * 0.17), 1.7 + ((v-45) * 0.14)
FROM generate_series(45, 110) as v;

-- ----------------- 2-5 AÑOS -----------------

-- Peso para Edad Niños (M) (eje_x = meses)
INSERT INTO oms_zscore_ninos_2_5a (genero, parametro, eje_x, z3, z2, z1, z0, zn1, zn2, zn3)
SELECT 'M', 'peso_edad', v,
    15.0 + ((v-24) * 0.26), 13.5 + ((v-24) * 0.23), 12.0 + ((v-24) * 0.2), 11.0 + ((v-24) * 0.17), 10.0 + ((v-24) * 0.15), 9.0 + ((v-24) * 0.13), 8.0 + ((v-24) * 0.11)
FROM generate_series(24, 60) as v;

-- Peso para Edad Niñas (F) (eje_x = meses)
INSERT INTO oms_zscore_ninos_2_5a (genero, parametro, eje_x, z3, z2, z1, z0, zn1, zn2, zn3)
SELECT 'F', 'peso_edad', v,
    14.5 + ((v-24) * 0.25), 13.0 + ((v-24) * 0.22), 11.5 + ((v-24) * 0.19), 10.5 + ((v-24) * 0.16), 9.5 + ((v-24) * 0.14), 8.5 + ((v-24) * 0.12), 7.5 + ((v-24) * 0.1)
FROM generate_series(24, 60) as v;

-- Peso para Longitud/Talla Niños (M) (eje_x = cm, de 65 a 120)
INSERT INTO oms_zscore_ninos_2_5a (genero, parametro, eje_x, z3, z2, z1, z0, zn1, zn2, zn3)
SELECT 'M', 'peso_longitud', v,
    10.0 + ((v-65) * 0.35), 9.5 + ((v-65) * 0.32), 9.0 + ((v-65) * 0.28), 8.5 + ((v-65) * 0.25), 8.0 + ((v-65) * 0.22), 7.5 + ((v-65) * 0.19), 7.0 + ((v-65) * 0.16)
FROM generate_series(65, 120) as v;

-- Peso para Longitud/Talla Niñas (F) (eje_x = cm, de 65 a 120)
INSERT INTO oms_zscore_ninos_2_5a (genero, parametro, eje_x, z3, z2, z1, z0, zn1, zn2, zn3)
SELECT 'F', 'peso_longitud', v,
    9.8 + ((v-65) * 0.33), 9.3 + ((v-65) * 0.3), 8.8 + ((v-65) * 0.26), 8.3 + ((v-65) * 0.23), 7.8 + ((v-65) * 0.2), 7.3 + ((v-65) * 0.17), 6.8 + ((v-65) * 0.14)
FROM generate_series(65, 120) as v;
