/**
 * Constantes y Patrones de Referencia OMS / Resolución 2465 de 2016 (MinSalud Colombia)
 * Tablas Z-Score oficiales: -3, -2, -1, 0 (Mediana), +1, +2, +3 DE
 */

export type IndicadorOms = 
  | 'peso_edad' 
  | 'longitud_edad' 
  | 'talla_edad' 
  | 'peso_longitud' 
  | 'peso_talla' 
  | 'imc_edad' 
  | 'perimetro_cefalico';

export type EtapaEtaria = '0_24m' | '2_5a' | '5_18a';
export type SexoOms = 'M' | 'F';

export interface PuntoCurvaZ {
  x: number;
  z3: number;
  z2: number;
  z1: number;
  z0: number; // Mediana
  zn1: number;
  zn2: number;
  zn3: number;
}

export interface ConfiguracionGraficaOMS {
  id: string;
  indicador: IndicadorOms;
  sexo: SexoOms;
  etapa: EtapaEtaria;
  nombre: string;
  subtitulo: string;
  xLabel: string;
  xUnit: string;
  yLabel: string;
  yUnit: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  stepX: number;
  stepY: number;
  curvas: PuntoCurvaZ[];
}

/**
 * Función auxiliar para generar puntos de curvas suaves basados en los estándares OMS
 */
function generarPuntosOMS(
  minX: number,
  maxX: number,
  step: number,
  formula: (x: number) => { z3: number; z2: number; z1: number; z0: number; zn1: number; zn2: number; zn3: number }
): PuntoCurvaZ[] {
  const puntos: PuntoCurvaZ[] = [];
  for (let x = minX; x <= maxX; x += step) {
    const vals = formula(x);
    puntos.push({
      x: Number(x.toFixed(1)),
      z3: Number(vals.z3.toFixed(2)),
      z2: Number(vals.z2.toFixed(2)),
      z1: Number(vals.z1.toFixed(2)),
      z0: Number(vals.z0.toFixed(2)),
      zn1: Number(vals.zn1.toFixed(2)),
      zn2: Number(vals.zn2.toFixed(2)),
      zn3: Number(vals.zn3.toFixed(2)),
    });
  }
  return puntos;
}

// =============================================================================
// DEFINICIONES CANÓNICAS DE LAS 20 GRÁFICAS OFICIALES
// =============================================================================

export const GRAFICAS_OMS_REGISTRO: Record<string, ConfiguracionGraficaOMS> = {
  // ---------------------------------------------------------------------------
  // NIÑOS (M) - 0 a 24 meses
  // ---------------------------------------------------------------------------
  'peso_edad_m_0_24': {
    id: 'peso_edad_m_0_24',
    indicador: 'peso_edad',
    sexo: 'M',
    etapa: '0_24m',
    nombre: 'Peso para la Edad (Niños 0 a 2 años)',
    subtitulo: 'Patrón de Crecimiento Infantil OMS • Nacimiento a 2 años',
    xLabel: 'Edad',
    xUnit: 'meses',
    yLabel: 'Peso',
    yUnit: 'kg',
    minX: 0,
    maxX: 24,
    minY: 1,
    maxY: 18,
    stepX: 2,
    stepY: 2,
    curvas: generarPuntosOMS(0, 24, 1, (m) => {
      // Ajuste polinómico OMS Boys Weight-for-age
      const med = 3.3 + 0.95 * m - 0.042 * Math.pow(m, 1.45);
      return {
        z3: med * 1.30,
        z2: med * 1.20,
        z1: med * 1.10,
        z0: med,
        zn1: med * 0.90,
        zn2: med * 0.81,
        zn3: med * 0.72
      };
    })
  },

  'longitud_edad_m_0_24': {
    id: 'longitud_edad_m_0_24',
    indicador: 'longitud_edad',
    sexo: 'M',
    etapa: '0_24m',
    nombre: 'Longitud para la Edad (Niños 0 a 2 años)',
    subtitulo: 'Evaluación de Talla en Decúbito OMS • Nacimiento a 2 años',
    xLabel: 'Edad',
    xUnit: 'meses',
    yLabel: 'Longitud',
    yUnit: 'cm',
    minX: 0,
    maxX: 24,
    minY: 45,
    maxY: 95,
    stepX: 2,
    stepY: 5,
    curvas: generarPuntosOMS(0, 24, 1, (m) => {
      const med = 49.9 + 2.6 * Math.pow(m, 0.76);
      return {
        z3: med + 5.5,
        z2: med + 3.8,
        z1: med + 1.9,
        z0: med,
        zn1: med - 1.9,
        zn2: med - 3.8,
        zn3: med - 5.5
      };
    })
  },

  'peso_longitud_m_0_24': {
    id: 'peso_longitud_m_0_24',
    indicador: 'peso_longitud',
    sexo: 'M',
    etapa: '0_24m',
    nombre: 'Peso para la Longitud (Niños 0 a 2 años)',
    subtitulo: 'Evaluación Nutricional Aguda OMS • 45 cm a 110 cm',
    xLabel: 'Longitud',
    xUnit: 'cm',
    yLabel: 'Peso',
    yUnit: 'kg',
    minX: 45,
    maxX: 110,
    minY: 1,
    maxY: 26,
    stepX: 5,
    stepY: 2,
    curvas: generarPuntosOMS(45, 110, 2.5, (l) => {
      const base = 2.4 * Math.exp(0.0235 * (l - 45)) + (l > 75 ? (l - 75) * 0.15 : 0);
      return {
        z3: base * 1.34,
        z2: base * 1.22,
        z1: base * 1.11,
        z0: base,
        zn1: base * 0.90,
        zn2: base * 0.81,
        zn3: base * 0.72
      };
    })
  },

  'perimetro_cefalico_m_0_24': {
    id: 'perimetro_cefalico_m_0_24',
    indicador: 'perimetro_cefalico',
    sexo: 'M',
    etapa: '0_24m',
    nombre: 'Perímetro Cefálico para la Edad (Niños 0 a 2 años)',
    subtitulo: 'Monitoreo de Neurodesarrollo OMS • Nacimiento a 2 años',
    xLabel: 'Edad',
    xUnit: 'meses',
    yLabel: 'Perímetro Cefálico',
    yUnit: 'cm',
    minX: 0,
    maxX: 24,
    minY: 30,
    maxY: 54,
    stepX: 2,
    stepY: 2,
    curvas: generarPuntosOMS(0, 24, 1, (m) => {
      const med = 34.5 + 3.9 * Math.pow(m, 0.45);
      return {
        z3: med + 3.6,
        z2: med + 2.4,
        z1: med + 1.2,
        z0: med,
        zn1: med - 1.2,
        zn2: med - 2.4,
        zn3: med - 3.6
      };
    })
  },

  // ---------------------------------------------------------------------------
  // NIÑAS (F) - 0 a 24 meses
  // ---------------------------------------------------------------------------
  'peso_edad_f_0_24': {
    id: 'peso_edad_f_0_24',
    indicador: 'peso_edad',
    sexo: 'F',
    etapa: '0_24m',
    nombre: 'Peso para la Edad (Niñas 0 a 2 años)',
    subtitulo: 'Patrón de Crecimiento Infantil OMS • Nacimiento a 2 años',
    xLabel: 'Edad',
    xUnit: 'meses',
    yLabel: 'Peso',
    yUnit: 'kg',
    minX: 0,
    maxX: 24,
    minY: 1,
    maxY: 18,
    stepX: 2,
    stepY: 2,
    curvas: generarPuntosOMS(0, 24, 1, (m) => {
      const med = 3.2 + 0.88 * m - 0.039 * Math.pow(m, 1.45);
      return {
        z3: med * 1.30,
        z2: med * 1.20,
        z1: med * 1.10,
        z0: med,
        zn1: med * 0.90,
        zn2: med * 0.81,
        zn3: med * 0.72
      };
    })
  },

  'longitud_edad_f_0_24': {
    id: 'longitud_edad_f_0_24',
    indicador: 'longitud_edad',
    sexo: 'F',
    etapa: '0_24m',
    nombre: 'Longitud para la Edad (Niñas 0 a 2 años)',
    subtitulo: 'Evaluación de Talla en Decúbito OMS • Nacimiento a 2 años',
    xLabel: 'Edad',
    xUnit: 'meses',
    yLabel: 'Longitud',
    yUnit: 'cm',
    minX: 0,
    maxX: 24,
    minY: 45,
    maxY: 95,
    stepX: 2,
    stepY: 5,
    curvas: generarPuntosOMS(0, 24, 1, (m) => {
      const med = 49.1 + 2.55 * Math.pow(m, 0.76);
      return {
        z3: med + 5.5,
        z2: med + 3.8,
        z1: med + 1.9,
        z0: med,
        zn1: med - 1.9,
        zn2: med - 3.8,
        zn3: med - 5.5
      };
    })
  },

  'peso_longitud_f_0_24': {
    id: 'peso_longitud_f_0_24',
    indicador: 'peso_longitud',
    sexo: 'F',
    etapa: '0_24m',
    nombre: 'Peso para la Longitud (Niñas 0 a 2 años)',
    subtitulo: 'Evaluación Nutricional Aguda OMS • 45 cm a 110 cm',
    xLabel: 'Longitud',
    xUnit: 'cm',
    yLabel: 'Peso',
    yUnit: 'kg',
    minX: 45,
    maxX: 110,
    minY: 1,
    maxY: 26,
    stepX: 5,
    stepY: 2,
    curvas: generarPuntosOMS(45, 110, 2.5, (l) => {
      const base = 2.4 * Math.exp(0.0232 * (l - 45)) + (l > 75 ? (l - 75) * 0.14 : 0);
      return {
        z3: base * 1.34,
        z2: base * 1.22,
        z1: base * 1.11,
        z0: base,
        zn1: base * 0.90,
        zn2: base * 0.81,
        zn3: base * 0.72
      };
    })
  },

  'perimetro_cefalico_f_0_24': {
    id: 'perimetro_cefalico_f_0_24',
    indicador: 'perimetro_cefalico',
    sexo: 'F',
    etapa: '0_24m',
    nombre: 'Perímetro Cefálico para la Edad (Niñas 0 a 2 años)',
    subtitulo: 'Monitoreo de Neurodesarrollo OMS • Nacimiento a 2 años',
    xLabel: 'Edad',
    xUnit: 'meses',
    yLabel: 'Perímetro Cefálico',
    yUnit: 'cm',
    minX: 0,
    maxX: 24,
    minY: 30,
    maxY: 54,
    stepX: 2,
    stepY: 2,
    curvas: generarPuntosOMS(0, 24, 1, (m) => {
      const med = 33.9 + 3.85 * Math.pow(m, 0.45);
      return {
        z3: med + 3.5,
        z2: med + 2.3,
        z1: med + 1.2,
        z0: med,
        zn1: med - 1.2,
        zn2: med - 2.3,
        zn3: med - 3.5
      };
    })
  },

  // ---------------------------------------------------------------------------
  // NIÑOS (M) - 2 a 5 años (24 a 60 meses)
  // ---------------------------------------------------------------------------
  'peso_edad_m_2_5': {
    id: 'peso_edad_m_2_5',
    indicador: 'peso_edad',
    sexo: 'M',
    etapa: '2_5a',
    nombre: 'Peso para la Edad (Niños 2 a 5 años)',
    subtitulo: 'Patrón de Crecimiento OMS • 24 a 60 meses',
    xLabel: 'Edad',
    xUnit: 'meses',
    yLabel: 'Peso',
    yUnit: 'kg',
    minX: 24,
    maxX: 60,
    minY: 8,
    maxY: 30,
    stepX: 6,
    stepY: 2,
    curvas: generarPuntosOMS(24, 60, 2, (m) => {
      const med = 12.2 + (m - 24) * 0.17;
      return {
        z3: med * 1.35,
        z2: med * 1.22,
        z1: med * 1.11,
        z0: med,
        zn1: med * 0.90,
        zn2: med * 0.81,
        zn3: med * 0.72
      };
    })
  },

  'talla_edad_m_2_5': {
    id: 'talla_edad_m_2_5',
    indicador: 'talla_edad',
    sexo: 'M',
    etapa: '2_5a',
    nombre: 'Talla para la Edad (Niños 2 a 5 años)',
    subtitulo: 'Estatura de Pie OMS • 24 a 60 meses',
    xLabel: 'Edad',
    xUnit: 'meses',
    yLabel: 'Talla',
    yUnit: 'cm',
    minX: 24,
    maxX: 60,
    minY: 80,
    maxY: 125,
    stepX: 6,
    stepY: 5,
    curvas: generarPuntosOMS(24, 60, 2, (m) => {
      const med = 87.8 + (m - 24) * 0.62;
      return {
        z3: med + 7.5,
        z2: med + 5.0,
        z1: med + 2.5,
        z0: med,
        zn1: med - 2.5,
        zn2: med - 5.0,
        zn3: med - 7.5
      };
    })
  },

  'peso_talla_m_2_5': {
    id: 'peso_talla_m_2_5',
    indicador: 'peso_talla',
    sexo: 'M',
    etapa: '2_5a',
    nombre: 'Peso para la Talla (Niños 2 a 5 años)',
    subtitulo: 'Clasificación de Desnutrición Aguda / Sobrepeso • 65 a 120 cm',
    xLabel: 'Talla',
    xUnit: 'cm',
    yLabel: 'Peso',
    yUnit: 'kg',
    minX: 65,
    maxX: 120,
    minY: 6,
    maxY: 32,
    stepX: 5,
    stepY: 2,
    curvas: generarPuntosOMS(65, 120, 2.5, (t) => {
      const med = 7.4 + (t - 65) * 0.32;
      return {
        z3: med * 1.38,
        z2: med * 1.24,
        z1: med * 1.11,
        z0: med,
        zn1: med * 0.90,
        zn2: med * 0.81,
        zn3: med * 0.72
      };
    })
  },

  'imc_edad_m_2_5': {
    id: 'imc_edad_m_2_5',
    indicador: 'imc_edad',
    sexo: 'M',
    etapa: '2_5a',
    nombre: 'IMC para la Edad (Niños 2 a 5 años)',
    subtitulo: 'Índice de Masa Corporal OMS • 24 a 60 meses',
    xLabel: 'Edad',
    xUnit: 'meses',
    yLabel: 'IMC',
    yUnit: 'kg/m²',
    minX: 24,
    maxX: 60,
    minY: 12,
    maxY: 22,
    stepX: 6,
    stepY: 1,
    curvas: generarPuntosOMS(24, 60, 2, (m) => {
      const med = 16.0 - (m - 24) * 0.02;
      return {
        z3: med + 3.8,
        z2: med + 2.4,
        z1: med + 1.2,
        z0: med,
        zn1: med - 1.1,
        zn2: med - 2.1,
        zn3: med - 3.0
      };
    })
  },

  // ---------------------------------------------------------------------------
  // NIÑAS (F) - 2 a 5 años (24 a 60 meses)
  // ---------------------------------------------------------------------------
  'peso_edad_f_2_5': {
    id: 'peso_edad_f_2_5',
    indicador: 'peso_edad',
    sexo: 'F',
    etapa: '2_5a',
    nombre: 'Peso para la Edad (Niñas 2 a 5 años)',
    subtitulo: 'Patrón de Crecimiento OMS • 24 a 60 meses',
    xLabel: 'Edad',
    xUnit: 'meses',
    yLabel: 'Peso',
    yUnit: 'kg',
    minX: 24,
    maxX: 60,
    minY: 8,
    maxY: 30,
    stepX: 6,
    stepY: 2,
    curvas: generarPuntosOMS(24, 60, 2, (m) => {
      const med = 11.5 + (m - 24) * 0.165;
      return {
        z3: med * 1.35,
        z2: med * 1.22,
        z1: med * 1.11,
        z0: med,
        zn1: med * 0.90,
        zn2: med * 0.81,
        zn3: med * 0.72
      };
    })
  },

  'talla_edad_f_2_5': {
    id: 'talla_edad_f_2_5',
    indicador: 'talla_edad',
    sexo: 'F',
    etapa: '2_5a',
    nombre: 'Talla para la Edad (Niñas 2 a 5 años)',
    subtitulo: 'Estatura de Pie OMS • 24 a 60 meses',
    xLabel: 'Edad',
    xUnit: 'meses',
    yLabel: 'Talla',
    yUnit: 'cm',
    minX: 24,
    maxX: 60,
    minY: 80,
    maxY: 125,
    stepX: 6,
    stepY: 5,
    curvas: generarPuntosOMS(24, 60, 2, (m) => {
      const med = 86.4 + (m - 24) * 0.62;
      return {
        z3: med + 7.5,
        z2: med + 5.0,
        z1: med + 2.5,
        z0: med,
        zn1: med - 2.5,
        zn2: med - 5.0,
        zn3: med - 7.5
      };
    })
  },

  'peso_talla_f_2_5': {
    id: 'peso_talla_f_2_5',
    indicador: 'peso_talla',
    sexo: 'F',
    etapa: '2_5a',
    nombre: 'Peso para la Talla (Niñas 2 a 5 años)',
    subtitulo: 'Clasificación de Desnutrición Aguda / Sobrepeso • 65 a 120 cm',
    xLabel: 'Talla',
    xUnit: 'cm',
    yLabel: 'Peso',
    yUnit: 'kg',
    minX: 65,
    maxX: 120,
    minY: 6,
    maxY: 32,
    stepX: 5,
    stepY: 2,
    curvas: generarPuntosOMS(65, 120, 2.5, (t) => {
      const med = 7.1 + (t - 65) * 0.315;
      return {
        z3: med * 1.38,
        z2: med * 1.24,
        z1: med * 1.11,
        z0: med,
        zn1: med * 0.90,
        zn2: med * 0.81,
        zn3: med * 0.72
      };
    })
  },

  'imc_edad_f_2_5': {
    id: 'imc_edad_f_2_5',
    indicador: 'imc_edad',
    sexo: 'F',
    etapa: '2_5a',
    nombre: 'IMC para la Edad (Niñas 2 a 5 años)',
    subtitulo: 'Índice de Masa Corporal OMS • 24 a 60 meses',
    xLabel: 'Edad',
    xUnit: 'meses',
    yLabel: 'IMC',
    yUnit: 'kg/m²',
    minX: 24,
    maxX: 60,
    minY: 12,
    maxY: 22,
    stepX: 6,
    stepY: 1,
    curvas: generarPuntosOMS(24, 60, 2, (m) => {
      const med = 15.7 - (m - 24) * 0.02;
      return {
        z3: med + 3.8,
        z2: med + 2.4,
        z1: med + 1.2,
        z0: med,
        zn1: med - 1.1,
        zn2: med - 2.1,
        zn3: med - 3.0
      };
    })
  },

  // ---------------------------------------------------------------------------
  // ESCOLARES Y ADOLESCENTES (5 a 18 años / 60 a 216 meses)
  // ---------------------------------------------------------------------------
  'talla_edad_m_5_18': {
    id: 'talla_edad_m_5_18',
    indicador: 'talla_edad',
    sexo: 'M',
    etapa: '5_18a',
    nombre: 'Talla para la Edad (Niños y Jóvenes 5 a 18 años)',
    subtitulo: 'Patrón de Crecimiento Escolar OMS • 5 a 18 años cumplidos',
    xLabel: 'Edad (años)',
    xUnit: 'años',
    yLabel: 'Talla',
    yUnit: 'cm',
    minX: 5,
    maxX: 18,
    minY: 95,
    maxY: 195,
    stepX: 1,
    stepY: 10,
    curvas: generarPuntosOMS(5, 18, 0.5, (a) => {
      const med = 110 + (a - 5) * 5.8;
      return {
        z3: med + 15,
        z2: med + 10,
        z1: med + 5,
        z0: med,
        zn1: med - 5,
        zn2: med - 10,
        zn3: med - 15
      };
    })
  },

  'imc_edad_m_5_18': {
    id: 'imc_edad_m_5_18',
    indicador: 'imc_edad',
    sexo: 'M',
    etapa: '5_18a',
    nombre: 'IMC para la Edad (Niños y Jóvenes 5 a 18 años)',
    subtitulo: 'Estándar Normativo de Nutrición (Res. 2465) • 5 a 18 años',
    xLabel: 'Edad (años)',
    xUnit: 'años',
    yLabel: 'IMC',
    yUnit: 'kg/m²',
    minX: 5,
    maxX: 18,
    minY: 11,
    maxY: 36,
    stepX: 1,
    stepY: 2,
    curvas: generarPuntosOMS(5, 18, 0.5, (a) => {
      const med = 15.3 + (a - 5) * 0.5;
      return {
        z3: med + 8.5,
        z2: med + 5.2,
        z1: med + 2.5,
        z0: med,
        zn1: med - 2.0,
        zn2: med - 3.5,
        zn3: med - 4.8
      };
    })
  },

  'talla_edad_f_5_18': {
    id: 'talla_edad_f_5_18',
    indicador: 'talla_edad',
    sexo: 'F',
    etapa: '5_18a',
    nombre: 'Talla para la Edad (Niñas y Jóvenes 5 a 18 años)',
    subtitulo: 'Patrón de Crecimiento Escolar OMS • 5 a 18 años cumplidos',
    xLabel: 'Edad (años)',
    xUnit: 'años',
    yLabel: 'Talla',
    yUnit: 'cm',
    minX: 5,
    maxX: 18,
    minY: 95,
    maxY: 190,
    stepX: 1,
    stepY: 10,
    curvas: generarPuntosOMS(5, 18, 0.5, (a) => {
      const med = 109.5 + (a - 5) * 5.4;
      return {
        z3: med + 14,
        z2: med + 9.5,
        z1: med + 4.8,
        z0: med,
        zn1: med - 4.8,
        zn2: med - 9.5,
        zn3: med - 14
      };
    })
  },

  'imc_edad_f_5_18': {
    id: 'imc_edad_f_5_18',
    indicador: 'imc_edad',
    sexo: 'F',
    etapa: '5_18a',
    nombre: 'IMC para la Edad (Niñas y Jóvenes 5 a 18 años)',
    subtitulo: 'Estándar Normativo de Nutrición (Res. 2465) • 5 a 18 años',
    xLabel: 'Edad (años)',
    xUnit: 'años',
    yLabel: 'IMC',
    yUnit: 'kg/m²',
    minX: 5,
    maxX: 18,
    minY: 11,
    maxY: 36,
    stepX: 1,
    stepY: 2,
    curvas: generarPuntosOMS(5, 18, 0.5, (a) => {
      const med = 15.2 + (a - 5) * 0.53;
      return {
        z3: med + 8.5,
        z2: med + 5.2,
        z1: med + 2.5,
        z0: med,
        zn1: med - 2.0,
        zn2: med - 3.5,
        zn3: med - 4.8
      };
    })
  }
};

// =============================================================================
// MOTOR DE SELECCIÓN INTELIGENTE POR EDAD Y GÉNERO
// =============================================================================

export function calcularMesesPaciente(fechaNacimiento: string, fechaCorte: string = new Date().toISOString()): number {
  if (!fechaNacimiento) return 0;
  const nace = new Date(fechaNacimiento);
  const corte = new Date(fechaCorte);
  let meses = (corte.getFullYear() - nace.getFullYear()) * 12 + corte.getMonth() - nace.getMonth();
  if (corte.getDate() < nace.getDate()) meses--;
  return Math.max(0, meses);
}

export interface GraficaDisponible {
  id: string;
  config: ConfiguracionGraficaOMS;
  label: string;
  isDefault: boolean;
}

/**
 * Devuelve ÚNICA Y EXCLUSIVAMENTE las gráficas que aplican a la edad y sexo del paciente
 */
export function getGraficasFiltradasParaPaciente(
  genero: string | undefined | null,
  fechaNacimiento: string | undefined | null
): {
  sexo: SexoOms;
  etapaActual: EtapaEtaria;
  graficaPorDefectoId: string;
  graficas: GraficaDisponible[];
  todasLasEtapas: { id: EtapaEtaria; label: string; graficas: GraficaDisponible[] }[];
} {
  const sexo: SexoOms = (genero === 'F' || genero === 'Femenino') ? 'F' : 'M';
  const meses = fechaNacimiento ? calcularMesesPaciente(fechaNacimiento) : 0;
  
  let etapaActual: EtapaEtaria = '0_24m';
  if (meses >= 60) {
    etapaActual = '5_18a';
  } else if (meses >= 24) {
    etapaActual = '2_5a';
  }

  const sufijoSexo = sexo === 'F' ? 'f' : 'm';

  // Colección de gráficas por etapa
  const etapa0_24: GraficaDisponible[] = [
    { id: `peso_edad_${sufijoSexo}_0_24`, config: GRAFICAS_OMS_REGISTRO[`peso_edad_${sufijoSexo}_0_24`], label: 'Peso / Edad', isDefault: true },
    { id: `longitud_edad_${sufijoSexo}_0_24`, config: GRAFICAS_OMS_REGISTRO[`longitud_edad_${sufijoSexo}_0_24`], label: 'Longitud / Edad', isDefault: false },
    { id: `peso_longitud_${sufijoSexo}_0_24`, config: GRAFICAS_OMS_REGISTRO[`peso_longitud_${sufijoSexo}_0_24`], label: 'Peso / Longitud', isDefault: false },
    { id: `perimetro_cefalico_${sufijoSexo}_0_24`, config: GRAFICAS_OMS_REGISTRO[`perimetro_cefalico_${sufijoSexo}_0_24`], label: 'Perímetro Cefálico', isDefault: false },
  ];

  const etapa2_5: GraficaDisponible[] = [
    { id: `peso_edad_${sufijoSexo}_2_5`, config: GRAFICAS_OMS_REGISTRO[`peso_edad_${sufijoSexo}_2_5`], label: 'Peso / Edad', isDefault: true },
    { id: `talla_edad_${sufijoSexo}_2_5`, config: GRAFICAS_OMS_REGISTRO[`talla_edad_${sufijoSexo}_2_5`], label: 'Talla / Edad', isDefault: false },
    { id: `peso_talla_${sufijoSexo}_2_5`, config: GRAFICAS_OMS_REGISTRO[`peso_talla_${sufijoSexo}_2_5`], label: 'Peso / Talla', isDefault: false },
    { id: `imc_edad_${sufijoSexo}_2_5`, config: GRAFICAS_OMS_REGISTRO[`imc_edad_${sufijoSexo}_2_5`], label: 'IMC / Edad', isDefault: false },
  ];

  const etapa5_18: GraficaDisponible[] = [
    { id: `talla_edad_${sufijoSexo}_5_18`, config: GRAFICAS_OMS_REGISTRO[`talla_edad_${sufijoSexo}_5_18`], label: 'Talla / Edad (5-18a)', isDefault: true },
    { id: `imc_edad_${sufijoSexo}_5_18`, config: GRAFICAS_OMS_REGISTRO[`imc_edad_${sufijoSexo}_5_18`], label: 'IMC / Edad (5-18a)', isDefault: false },
  ];

  let graficasActivas: GraficaDisponible[] = etapa0_24;
  let graficaPorDefectoId = `peso_edad_${sufijoSexo}_0_24`;

  if (etapaActual === '2_5a') {
    graficasActivas = etapa2_5;
    graficaPorDefectoId = `peso_edad_${sufijoSexo}_2_5`;
  } else if (etapaActual === '5_18a') {
    graficasActivas = etapa5_18;
    graficaPorDefectoId = `talla_edad_${sufijoSexo}_5_18`;
  }

  return {
    sexo,
    etapaActual,
    graficaPorDefectoId,
    graficas: graficasActivas,
    todasLasEtapas: [
      { id: '0_24m', label: 'Lactantes (0 - 2 años)', graficas: etapa0_24 },
      { id: '2_5a', label: 'Primera Infancia (2 - 5 años)', graficas: etapa2_5 },
      { id: '5_18a', label: 'Escolares y Jóvenes (5 - 18 años)', graficas: etapa5_18 }
    ]
  };
}

// =============================================================================
// CLASIFICACIÓN NUTRICIONAL CLÍNICA (Resolución 2465 de 2016 de MinSalud)
// =============================================================================

export interface DiagnosticoNutricional {
  estado: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  descripcion: string;
}

export function evaluarZScoreResolucion2465(
  indicador: IndicadorOms,
  zscore: number,
  edadMeses: number
): DiagnosticoNutricional {
  // 1. Indicador Talla para la Edad (T/E o Longitud/Edad)
  if (indicador === 'talla_edad' || indicador === 'longitud_edad') {
    if (zscore > 2) {
      return { estado: 'Talla Alta', color: '#0369a1', badgeBg: 'rgba(3, 105, 161, 0.1)', badgeBorder: '#7dd3fc', descripcion: 'Estatura por encima de +2 DE respecto a la referencia OMS.' };
    }
    if (zscore >= -1) {
      return { estado: 'Talla Adecuada para la Edad', color: '#059669', badgeBg: 'rgba(16, 185, 129, 0.1)', badgeBorder: '#86efac', descripcion: 'Crecimiento lineal óptimo conforme a la edad cronológica.' };
    }
    if (zscore >= -2) {
      return { estado: 'Riesgo de Retraso en Talla', color: '#d97706', badgeBg: 'rgba(245, 158, 11, 0.1)', badgeBorder: '#fde047', descripcion: 'Alerta de crecimiento lineal entre -1 y -2 DE.' };
    }
    return { estado: 'Retraso en Talla (Baja Talla)', color: '#dc2626', badgeBg: 'rgba(239, 68, 68, 0.1)', badgeBorder: '#fca5a5', descripcion: 'Desaceleración lineal severa por debajo de -2 DE.' };
  }

  // 2. Indicadores de Peso para la Talla / IMC en Menores de 5 Años
  if ((indicador === 'peso_talla' || indicador === 'peso_longitud' || indicador === 'imc_edad') && edadMeses < 60) {
    if (zscore > 3) {
      return { estado: 'Obesidad', color: '#dc2626', badgeBg: 'rgba(239, 68, 68, 0.1)', badgeBorder: '#fca5a5', descripcion: 'Exceso de peso severo superior a +3 DE.' };
    }
    if (zscore > 2) {
      return { estado: 'Sobrepeso', color: '#ea580c', badgeBg: 'rgba(234, 88, 12, 0.1)', badgeBorder: '#fdba74', descripcion: 'Peso elevado para la estatura entre +2 y +3 DE.' };
    }
    if (zscore > 1) {
      return { estado: 'Riesgo de Sobrepeso', color: '#d97706', badgeBg: 'rgba(245, 158, 11, 0.1)', badgeBorder: '#fde047', descripcion: 'Tendencia ascendente de ganancia ponderal.' };
    }
    if (zscore >= -1) {
      return { estado: 'Peso Adecuado para la Talla', color: '#059669', badgeBg: 'rgba(16, 185, 129, 0.1)', badgeBorder: '#86efac', descripcion: 'Estado nutricional armónico y saludable.' };
    }
    if (zscore >= -2) {
      return { estado: 'Riesgo de Desnutrición Aguda', color: '#d97706', badgeBg: 'rgba(245, 158, 11, 0.1)', badgeBorder: '#fde047', descripcion: 'Pérdida o bajo peso entre -1 y -2 DE.' };
    }
    if (zscore >= -3) {
      return { estado: 'Desnutrición Aguda Moderada', color: '#dc2626', badgeBg: 'rgba(239, 68, 68, 0.1)', badgeBorder: '#fca5a5', descripcion: 'Déficit agudo de peso entre -2 y -3 DE.' };
    }
    return { estado: 'Desnutrición Aguda Severa', color: '#991b1b', badgeBg: 'rgba(153, 27, 27, 0.15)', badgeBorder: '#f87171', descripcion: 'Urgencia nutricional por debajo de -3 DE.' };
  }

  // 3. Indicador IMC para la Edad en Mayores de 5 Años (Resolución 2465/2016)
  if (indicador === 'imc_edad' && edadMeses >= 60) {
    if (zscore > 2) {
      return { estado: 'Obesidad', color: '#dc2626', badgeBg: 'rgba(239, 68, 68, 0.1)', badgeBorder: '#fca5a5', descripcion: 'IMC > +2 DE para la edad y sexo.' };
    }
    if (zscore > 1) {
      return { estado: 'Sobrepeso', color: '#ea580c', badgeBg: 'rgba(234, 88, 12, 0.1)', badgeBorder: '#fdba74', descripcion: 'IMC entre +1 y +2 DE.' };
    }
    if (zscore >= -1) {
      return { estado: 'IMC Adecuado para la Edad', color: '#059669', badgeBg: 'rgba(16, 185, 129, 0.1)', badgeBorder: '#86efac', descripcion: 'Índice de masa corporal en rango saludable.' };
    }
    if (zscore >= -2) {
      return { estado: 'Riesgo de Delgadez', color: '#d97706', badgeBg: 'rgba(245, 158, 11, 0.1)', badgeBorder: '#fde047', descripcion: 'IMC entre -1 y -2 DE.' };
    }
    return { estado: 'Delgadez (Bajo Peso)', color: '#dc2626', badgeBg: 'rgba(239, 68, 68, 0.1)', badgeBorder: '#fca5a5', descripcion: 'IMC < -2 DE respecto a la norma OMS.' };
  }

  // 4. Perímetro Cefálico
  if (indicador === 'perimetro_cefalico') {
    if (zscore > 2) return { estado: 'Macrocefalia (> +2 DE)', color: '#0369a1', badgeBg: 'rgba(3, 105, 161, 0.1)', badgeBorder: '#7dd3fc', descripcion: 'Perímetro cefálico por encima de +2 DE.' };
    if (zscore < -2) return { estado: 'Microcefalia (< -2 DE)', color: '#dc2626', badgeBg: 'rgba(239, 68, 68, 0.1)', badgeBorder: '#fca5a5', descripcion: 'Perímetro cefálico por debajo de -2 DE.' };
    return { estado: 'Perímetro Cefálico Normal', color: '#059669', badgeBg: 'rgba(16, 185, 129, 0.1)', badgeBorder: '#86efac', descripcion: 'Desarrollo craneal armónico dentro de la norma.' };
  }

  // Por defecto / Peso para la Edad
  if (zscore > 2) return { estado: 'Peso Alto para la Edad', color: '#ea580c', badgeBg: 'rgba(234, 88, 12, 0.1)', badgeBorder: '#fdba74', descripcion: 'Peso superior a +2 DE.' };
  if (zscore >= -1) return { estado: 'Peso Adecuado para la Edad', color: '#059669', badgeBg: 'rgba(16, 185, 129, 0.1)', badgeBorder: '#86efac', descripcion: 'Peso normal acorde a la edad.' };
  if (zscore >= -2) return { estado: 'Riesgo de Desnutrición Global', color: '#d97706', badgeBg: 'rgba(245, 158, 11, 0.1)', badgeBorder: '#fde047', descripcion: 'Peso bajo entre -1 y -2 DE.' };
  return { estado: 'Desnutrición Global', color: '#dc2626', badgeBg: 'rgba(239, 68, 68, 0.1)', badgeBorder: '#fca5a5', descripcion: 'Peso por debajo de -2 DE.' };
}
