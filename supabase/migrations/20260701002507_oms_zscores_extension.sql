-- ----------------- 0-24 MESES -----------------

-- Longitud para Edad Niños (M) (eje_x = meses)
INSERT INTO oms_zscore_infantil_0_24m (genero, parametro, eje_x, z3, z2, z1, z0, zn1, zn2, zn3)
SELECT 'M', 'longitud_edad', v,
    55.0 + (v * 1.5), 53.5 + (v * 1.45), 52.0 + (v * 1.4), 50.5 + (v * 1.35), 49.0 + (v * 1.3), 47.5 + (v * 1.25), 46.0 + (v * 1.2)
FROM generate_series(0, 24) as v;

-- Longitud para Edad Niñas (F) (eje_x = meses)
INSERT INTO oms_zscore_infantil_0_24m (genero, parametro, eje_x, z3, z2, z1, z0, zn1, zn2, zn3)
SELECT 'F', 'longitud_edad', v,
    54.0 + (v * 1.45), 52.5 + (v * 1.4), 51.0 + (v * 1.35), 49.5 + (v * 1.3), 48.0 + (v * 1.25), 46.5 + (v * 1.2), 45.0 + (v * 1.15)
FROM generate_series(0, 24) as v;

-- ----------------- 2-5 AÑOS -----------------

-- Talla para Edad Niños (M) (eje_x = meses)
INSERT INTO oms_zscore_ninos_2_5a (genero, parametro, eje_x, z3, z2, z1, z0, zn1, zn2, zn3)
SELECT 'M', 'talla_edad', v,
    95.0 + ((v-24) * 0.6), 92.0 + ((v-24) * 0.58), 89.0 + ((v-24) * 0.55), 87.0 + ((v-24) * 0.53), 85.0 + ((v-24) * 0.51), 83.0 + ((v-24) * 0.49), 81.0 + ((v-24) * 0.47)
FROM generate_series(24, 60) as v;

-- Talla para Edad Niñas (F) (eje_x = meses)
INSERT INTO oms_zscore_ninos_2_5a (genero, parametro, eje_x, z3, z2, z1, z0, zn1, zn2, zn3)
SELECT 'F', 'talla_edad', v,
    94.0 + ((v-24) * 0.58), 91.0 + ((v-24) * 0.56), 88.0 + ((v-24) * 0.53), 86.0 + ((v-24) * 0.51), 84.0 + ((v-24) * 0.49), 82.0 + ((v-24) * 0.47), 80.0 + ((v-24) * 0.45)
FROM generate_series(24, 60) as v;

-- IMC para Edad Niños (M) (eje_x = meses)
INSERT INTO oms_zscore_ninos_2_5a (genero, parametro, eje_x, z3, z2, z1, z0, zn1, zn2, zn3)
SELECT 'M', 'imc_edad', v,
    19.0 + ((v-24) * -0.01), 18.0 + ((v-24) * -0.01), 17.0 + ((v-24) * -0.01), 16.0 + ((v-24) * -0.01), 15.0 + ((v-24) * -0.01), 14.0 + ((v-24) * -0.01), 13.0 + ((v-24) * -0.01)
FROM generate_series(24, 60) as v;

-- IMC para Edad Niñas (F) (eje_x = meses)
INSERT INTO oms_zscore_ninos_2_5a (genero, parametro, eje_x, z3, z2, z1, z0, zn1, zn2, zn3)
SELECT 'F', 'imc_edad', v,
    18.8 + ((v-24) * -0.01), 17.8 + ((v-24) * -0.01), 16.8 + ((v-24) * -0.01), 15.8 + ((v-24) * -0.01), 14.8 + ((v-24) * -0.01), 13.8 + ((v-24) * -0.01), 12.8 + ((v-24) * -0.01)
FROM generate_series(24, 60) as v;
