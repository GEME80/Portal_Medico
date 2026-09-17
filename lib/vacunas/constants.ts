export interface FilaEsquema {
  id: string;
  categoriaId: string;
  edad: string;
  dosis: string;
  biologicoSugerido: string;
  matchKeywords: string[];
  dosisMatchKeywords: string[];
  enfermedadPrevenida: string;
}

export interface CategoriaCarne {
  id: string;
  titulo: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  filas: FilaEsquema[];
}

export interface PlantillaVacuna {
  nombre: string;
  enfermedad: string;
  edad: string;
  via: string;
  sitio: string;
  dosisDefecto: string;
}

/**
 * Plantillas estándar de esquemas vacunales individuales
 */
export const PLANTILLAS_VACUNAS: PlantillaVacuna[] = [
  { nombre: "BCG (Tuberculosis)", enfermedad: "Tuberculosis Meníngea y Miliar", edad: "Recién Nacido", via: "Intradérmica", sitio: "Deltoides derecho", dosisDefecto: "0" },
  { nombre: "Hepatitis B Pediátrica", enfermedad: "Hepatitis B", edad: "Recién Nacido", via: "Intramuscular", sitio: "Vasto externo muslo", dosisDefecto: "RN" },
  { nombre: "Hexavalente (Hexaxim / Infanrix)", enfermedad: "Polio, Hepatitis B, Hib, Difteria, Tétanos, Tosferina", edad: "2º Mes", via: "Intramuscular", sitio: "Vasto externo muslo", dosisDefecto: "1ª" },
  { nombre: "Polio Inyectable (IPV)", enfermedad: "Poliomielitis", edad: "2º Mes", via: "Intramuscular", sitio: "Vasto externo muslo", dosisDefecto: "1ª" },
  { nombre: "Rotavirus (Rotateq / Rotarix)", enfermedad: "Diarrea por Rotavirus", edad: "2º Mes", via: "Oral", sitio: "Vía oral", dosisDefecto: "1ª" },
  { nombre: "Neumococo Conjugada (PCV13 / PCV15)", enfermedad: "Neumonía, Meningitis, Otitis por S. Pneumoniae", edad: "2 a 3 Meses", via: "Intramuscular", sitio: "Vasto externo muslo", dosisDefecto: "1ª" },
  { nombre: "Meningococo (Nimenrix / MenQuadfi)", enfermedad: "Enfermedad Meningocócica Invasiva", edad: "Entre 9 a 12 Meses", via: "Intramuscular", sitio: "Vasto externo muslo", dosisDefecto: "1ª" },
  { nombre: "Influenza Estacional", enfermedad: "Gripe / Influenza A y B", edad: "A partir de los 6 Meses", via: "Intramuscular", sitio: "Vasto externo muslo", dosisDefecto: "1ª" },
  { nombre: "Triple Viral SRP (Priorix / MMR)", enfermedad: "Sarampión, Rubeola, Paperas", edad: "1 Año", via: "Subcutánea", sitio: "Deltoides brazo", dosisDefecto: "1ª" },
  { nombre: "Varicela (Varilrix / Varivax)", enfermedad: "Varicela", edad: "1 Año", via: "Subcutánea", sitio: "Deltoides brazo", dosisDefecto: "1ª" },
  { nombre: "Hepatitis A (Avaxim / Havrix)", enfermedad: "Hepatitis A", edad: "Entre 1 y 2 Años", via: "Intramuscular", sitio: "Deltoides brazo", dosisDefecto: "1ª" },
  { nombre: "Fiebre Amarilla", enfermedad: "Fiebre Amarilla", edad: "1 Año", via: "Subcutánea", sitio: "Deltoides brazo", dosisDefecto: "Única" },
  { nombre: "Tetraxim (DTP + Polio)", enfermedad: "Difteria, Tos ferina, Tétano, Polio", edad: "1 Año después de la 3ª dosis", via: "Intramuscular", sitio: "Deltoides brazo", dosisDefecto: "1er Refuerzo" },
  { nombre: "DTP (Difteria, Tétanos, Tosferina)", enfermedad: "Difteria, Tétanos, Tosferina", edad: "1 Año después de la 3ª dosis", via: "Intramuscular", sitio: "Deltoides brazo", dosisDefecto: "1er Refuerzo" },
  { nombre: "VPH (Gardasil 9)", enfermedad: "Cáncer de cuello uterino, verrugas por VPH", edad: "A partir de los 9 Años", via: "Intramuscular", sitio: "Deltoides brazo", dosisDefecto: "1ª" },
  { nombre: "Dengue (Qdenga)", enfermedad: "Fiebre por Dengue y formas graves", edad: "A partir de los 4 Años", via: "Subcutánea", sitio: "Deltoides brazo", dosisDefecto: "1ª" },
  { nombre: "COVID-19 Actualizada", enfermedad: "SARS-CoV-2", edad: "6 Meses en adelante", via: "Intramuscular", sitio: "Deltoides brazo", dosisDefecto: "Dosis Actualizada" }
];

/**
 * Matriz canónica exacta extraída del carné físico oficial del Dr. Carlos Torres
 * 14 Categorías estándar de protección pediátrica
 */
export const ESQUEMA_MATRIZ_CANONICO: CategoriaCarne[] = [
  {
    id: "bcg",
    titulo: "TUBERCULOSIS B.C.G.",
    badgeBg: "bg-emerald-100/70",
    badgeText: "text-emerald-900",
    badgeBorder: "border-emerald-300",
    filas: [
      {
        id: "bcg_0",
        categoriaId: "bcg",
        edad: "Recién Nacido",
        dosis: "0",
        biologicoSugerido: "B.C.G.",
        matchKeywords: ["bcg", "tuberculosis"],
        dosisMatchKeywords: ["0", "unica", "rn", "recien"],
        enfermedadPrevenida: "TUBERCULOSIS B.C.G."
      }
    ]
  },
  {
    id: "polio",
    titulo: "POLIO I.M.",
    badgeBg: "bg-sky-100/70",
    badgeText: "text-sky-900",
    badgeBorder: "border-sky-300",
    filas: [
      {
        id: "polio_1",
        categoriaId: "polio",
        edad: "2º Mes",
        dosis: "1ª",
        biologicoSugerido: "Hexa / IPV",
        matchKeywords: ["polio", "ipv", "opv", "poliomielitis", "hexa", "hexavalente", "hexaxim", "infanrix hexa"],
        dosisMatchKeywords: ["1", "1ª", "1ra", "primera", "2 mes", "2 meses", "2º mes"],
        enfermedadPrevenida: "POLIO I.M."
      },
      {
        id: "polio_2",
        categoriaId: "polio",
        edad: "4º Mes",
        dosis: "2ª",
        biologicoSugerido: "Hexa / IPV",
        matchKeywords: ["polio", "ipv", "opv", "poliomielitis", "hexa", "hexavalente", "hexaxim", "infanrix hexa"],
        dosisMatchKeywords: ["2", "2ª", "2da", "segunda", "4 mes", "4 meses", "4º mes"],
        enfermedadPrevenida: "POLIO I.M."
      },
      {
        id: "polio_3",
        categoriaId: "polio",
        edad: "6º Mes",
        dosis: "3ª",
        biologicoSugerido: "Hexa / IPV",
        matchKeywords: ["polio", "ipv", "opv", "poliomielitis", "hexa", "hexavalente", "hexaxim", "infanrix hexa"],
        dosisMatchKeywords: ["3", "3ª", "3ra", "tercera", "6 mes", "6 meses", "6º mes"],
        enfermedadPrevenida: "POLIO I.M."
      },
      {
        id: "polio_ref1",
        categoriaId: "polio",
        edad: "1 Año después de la 3ª dosis",
        dosis: "1er Refuerzo",
        biologicoSugerido: "Tetraxim / IPV",
        matchKeywords: ["polio", "ipv", "opv", "tetraxim", "infanrix tetra"],
        dosisMatchKeywords: ["refuerzo 1", "1er refuerzo", "1 refuerzo", "ref 1", "18 meses", "1 año"],
        enfermedadPrevenida: "POLIO I.M."
      },
      {
        id: "polio_ref2",
        categoriaId: "polio",
        edad: "5 Años",
        dosis: "2º Refuerzo",
        biologicoSugerido: "Tetraxim / IPV",
        matchKeywords: ["polio", "ipv", "opv", "tetraxim", "infanrix tetra"],
        dosisMatchKeywords: ["refuerzo 2", "2º refuerzo", "2do refuerzo", "2 refuerzo", "ref 2", "5 años"],
        enfermedadPrevenida: "POLIO I.M."
      }
    ]
  },
  {
    id: "hepb",
    titulo: "HEPATITIS B",
    badgeBg: "bg-indigo-100/70",
    badgeText: "text-indigo-900",
    badgeBorder: "border-indigo-300",
    filas: [
      {
        id: "hepb_rn",
        categoriaId: "hepb",
        edad: "Recién Nacido",
        dosis: "RN",
        biologicoSugerido: "Hep B Pediátrica",
        matchKeywords: ["hepatitis b", "hepb", "hep b", "engerix"],
        dosisMatchKeywords: ["rn", "recien nacido", "0", "unica", "1", "1ra"],
        enfermedadPrevenida: "HEPATITIS B"
      },
      {
        id: "hepb_2m",
        categoriaId: "hepb",
        edad: "2º Mes",
        dosis: "2ª",
        biologicoSugerido: "Hexa / Pentavalente",
        matchKeywords: ["hepatitis b", "hepb", "hep b", "hexa", "hexavalente", "hexaxim", "infanrix hexa", "pentavalente"],
        dosisMatchKeywords: ["2", "2ª", "2da", "segunda", "2 mes", "2 meses", "2º mes"],
        enfermedadPrevenida: "HEPATITIS B"
      },
      {
        id: "hepb_6m",
        categoriaId: "hepb",
        edad: "6º Mes",
        dosis: "3ª",
        biologicoSugerido: "Hexa / Pentavalente",
        matchKeywords: ["hepatitis b", "hepb", "hep b", "hexa", "hexavalente", "hexaxim", "infanrix hexa", "pentavalente"],
        dosisMatchKeywords: ["3", "3ª", "3ra", "tercera", "6 mes", "6 meses", "6º mes"],
        enfermedadPrevenida: "HEPATITIS B"
      }
    ]
  },
  {
    id: "hib",
    titulo: "HAEMOPHILUS INFLUENZAE TIPO B (Hib)",
    badgeBg: "bg-amber-100/70",
    badgeText: "text-amber-900",
    badgeBorder: "border-amber-300",
    filas: [
      {
        id: "hib_1",
        categoriaId: "hib",
        edad: "2º Mes",
        dosis: "1ª",
        biologicoSugerido: "Hexa / Hib",
        matchKeywords: ["hib", "haemophilus", "hexa", "hexavalente", "hexaxim", "infanrix hexa", "pentavalente"],
        dosisMatchKeywords: ["1", "1ª", "1ra", "primera", "2 mes", "2 meses", "2º mes"],
        enfermedadPrevenida: "HAEMOPHILUS INFLUENZAE TIPO B (Hib)"
      },
      {
        id: "hib_2",
        categoriaId: "hib",
        edad: "4º Mes",
        dosis: "2ª",
        biologicoSugerido: "Hexa / Hib",
        matchKeywords: ["hib", "haemophilus", "hexa", "hexavalente", "hexaxim", "infanrix hexa", "pentavalente"],
        dosisMatchKeywords: ["2", "2ª", "2da", "segunda", "4 mes", "4 meses", "4º mes"],
        enfermedadPrevenida: "HAEMOPHILUS INFLUENZAE TIPO B (Hib)"
      },
      {
        id: "hib_3",
        categoriaId: "hib",
        edad: "6º Mes",
        dosis: "3ª",
        biologicoSugerido: "Hexa / Hib",
        matchKeywords: ["hib", "haemophilus", "hexa", "hexavalente", "hexaxim", "infanrix hexa", "pentavalente"],
        dosisMatchKeywords: ["3", "3ª", "3ra", "tercera", "6 mes", "6 meses", "6º mes"],
        enfermedadPrevenida: "HAEMOPHILUS INFLUENZAE TIPO B (Hib)"
      },
      {
        id: "hib_ref",
        categoriaId: "hib",
        edad: "1 Año después de la 3ª dosis",
        dosis: "Refuerzo",
        biologicoSugerido: "Hib / Pentavalente",
        matchKeywords: ["hib", "haemophilus", "pentavalente"],
        dosisMatchKeywords: ["refuerzo", "ref", "1er refuerzo", "18 meses", "1 año"],
        enfermedadPrevenida: "HAEMOPHILUS INFLUENZAE TIPO B (Hib)"
      }
    ]
  },
  {
    id: "dtp",
    titulo: "DIFTERIA - TOS FERINA - TETANO (DTP)",
    badgeBg: "bg-rose-100/70",
    badgeText: "text-rose-900",
    badgeBorder: "border-rose-300",
    filas: [
      {
        id: "dtp_1",
        categoriaId: "dtp",
        edad: "2º Mes",
        dosis: "1ª",
        biologicoSugerido: "Hexa / DTPa",
        matchKeywords: ["dtp", "dtpa", "dpt", "difteria", "tos ferina", "tetano", "hexa", "hexavalente", "hexaxim", "infanrix hexa", "pentavalente"],
        dosisMatchKeywords: ["1", "1ª", "1ra", "primera", "2 mes", "2 meses", "2º mes"],
        enfermedadPrevenida: "DIFTERIA - TOS FERINA - TETANO (DTP)"
      },
      {
        id: "dtp_2",
        categoriaId: "dtp",
        edad: "4º Mes",
        dosis: "2ª",
        biologicoSugerido: "Hexa / DTPa",
        matchKeywords: ["dtp", "dtpa", "dpt", "difteria", "tos ferina", "tetano", "hexa", "hexavalente", "hexaxim", "infanrix hexa", "pentavalente"],
        dosisMatchKeywords: ["2", "2ª", "2da", "segunda", "4 mes", "4 meses", "4º mes"],
        enfermedadPrevenida: "DIFTERIA - TOS FERINA - TETANO (DTP)"
      },
      {
        id: "dtp_3",
        categoriaId: "dtp",
        edad: "6º Mes",
        dosis: "3ª",
        biologicoSugerido: "Hexa / DTPa",
        matchKeywords: ["dtp", "dtpa", "dpt", "difteria", "tos ferina", "tetano", "hexa", "hexavalente", "hexaxim", "infanrix hexa", "pentavalente"],
        dosisMatchKeywords: ["3", "3ª", "3ra", "tercera", "6 mes", "6 meses", "6º mes"],
        enfermedadPrevenida: "DIFTERIA - TOS FERINA - TETANO (DTP)"
      },
      {
        id: "dtp_ref1",
        categoriaId: "dtp",
        edad: "1 Año después de la 3ª dosis",
        dosis: "1er Refuerzo",
        biologicoSugerido: "Tetraxim / DTPa",
        matchKeywords: ["dtp", "dtpa", "dpt", "difteria", "tetraxim", "infanrix tetra"],
        dosisMatchKeywords: ["refuerzo 1", "1er refuerzo", "1 refuerzo", "ref 1", "18 meses", "1 año"],
        enfermedadPrevenida: "DIFTERIA - TOS FERINA - TETANO (DTP)"
      },
      {
        id: "dtp_ref2",
        categoriaId: "dtp",
        edad: "5 Años",
        dosis: "2º Refuerzo",
        biologicoSugerido: "Tetraxim / DTPa",
        matchKeywords: ["dtp", "dtpa", "dpt", "difteria", "tetraxim", "infanrix tetra"],
        dosisMatchKeywords: ["refuerzo 2", "2º refuerzo", "2do refuerzo", "2 refuerzo", "ref 2", "5 años"],
        enfermedadPrevenida: "DIFTERIA - TOS FERINA - TETANO (DTP)"
      }
    ]
  },
  {
    id: "fiebre_amarilla",
    titulo: "FIEBRE AMARILLA",
    badgeBg: "bg-yellow-100/70",
    badgeText: "text-yellow-900",
    badgeBorder: "border-yellow-300",
    filas: [
      {
        id: "fa_unica",
        categoriaId: "fiebre_amarilla",
        edad: "1 Año",
        dosis: "Única",
        biologicoSugerido: "Fiebre Amarilla (Stamaril)",
        matchKeywords: ["amarilla", "stamaril", "fa"],
        dosisMatchKeywords: ["unica", "1", "1ª", "1ra", "1 año"],
        enfermedadPrevenida: "FIEBRE AMARILLA"
      },
      {
        id: "fa_refuerzo",
        categoriaId: "fiebre_amarilla",
        edad: "Cada 10 Años",
        dosis: "Refuerzo",
        biologicoSugerido: "Fiebre Amarilla",
        matchKeywords: ["amarilla", "stamaril", "fa"],
        dosisMatchKeywords: ["refuerzo", "10", "ref"],
        enfermedadPrevenida: "FIEBRE AMARILLA"
      }
    ]
  },
  {
    id: "srp",
    titulo: "SARAMPION - RUBEOLA - PAPERAS (SRP)",
    badgeBg: "bg-blue-100/70",
    badgeText: "text-blue-900",
    badgeBorder: "border-blue-300",
    filas: [
      {
        id: "srp_1",
        categoriaId: "srp",
        edad: "1 Año",
        dosis: "1ª",
        biologicoSugerido: "Priorix / MMR / SRP",
        matchKeywords: ["srp", "triple viral", "sarampion", "priorix", "mmr", "rubeola", "paperas"],
        dosisMatchKeywords: ["1", "1ª", "1ra", "primera", "1 año", "12 meses"],
        enfermedadPrevenida: "SARAMPION - RUBEOLA - PAPERAS (SRP)"
      },
      {
        id: "srp_2",
        categoriaId: "srp",
        edad: "4 Años",
        dosis: "2ª",
        biologicoSugerido: "Priorix / MMR / SRP",
        matchKeywords: ["srp", "triple viral", "sarampion", "priorix", "mmr", "rubeola", "paperas"],
        dosisMatchKeywords: ["2", "2ª", "2da", "segunda", "4 años", "5 años", "refuerzo"],
        enfermedadPrevenida: "SARAMPION - RUBEOLA - PAPERAS (SRP)"
      }
    ]
  },
  {
    id: "neumococo",
    titulo: "NEUMOCOCO",
    badgeBg: "bg-teal-100/70",
    badgeText: "text-teal-900",
    badgeBorder: "border-teal-300",
    filas: [
      {
        id: "neumo_1",
        categoriaId: "neumococo",
        edad: "2 a 3 Meses",
        dosis: "1ª",
        biologicoSugerido: "Prevenar-13 / PCV13",
        matchKeywords: ["neumococo", "prevenar", "pcv", "synflorix", "vaxneuvance"],
        dosisMatchKeywords: ["1", "1ª", "1ra", "primera", "2 mes", "3 mes"],
        enfermedadPrevenida: "NEUMOCOCO"
      },
      {
        id: "neumo_2",
        categoriaId: "neumococo",
        edad: "4 a 5 Meses",
        dosis: "2ª",
        biologicoSugerido: "Prevenar-13 / PCV13",
        matchKeywords: ["neumococo", "prevenar", "pcv", "synflorix", "vaxneuvance"],
        dosisMatchKeywords: ["2", "2ª", "2da", "segunda", "4 mes", "5 mes"],
        enfermedadPrevenida: "NEUMOCOCO"
      },
      {
        id: "neumo_3",
        categoriaId: "neumococo",
        edad: "6 a 7 Meses",
        dosis: "3ª",
        biologicoSugerido: "Prevenar-13 / PCV13",
        matchKeywords: ["neumococo", "prevenar", "pcv", "synflorix", "vaxneuvance"],
        dosisMatchKeywords: ["3", "3ª", "3ra", "tercera", "6 mes", "7 mes"],
        enfermedadPrevenida: "NEUMOCOCO"
      },
      {
        id: "neumo_ref",
        categoriaId: "neumococo",
        edad: "1 Año después de la 3ª dosis",
        dosis: "1er Refuerzo",
        biologicoSugerido: "Prevenar-13 / PCV13",
        matchKeywords: ["neumococo", "prevenar", "pcv", "synflorix", "vaxneuvance"],
        dosisMatchKeywords: ["refuerzo", "ref 1", "1er refuerzo", "1 año", "12 meses", "18 meses"],
        enfermedadPrevenida: "NEUMOCOCO"
      }
    ]
  },
  {
    id: "rotavirus",
    titulo: "ROTAVIRUS",
    badgeBg: "bg-pink-100/70",
    badgeText: "text-pink-900",
    badgeBorder: "border-pink-300",
    filas: [
      {
        id: "rota_1",
        categoriaId: "rotavirus",
        edad: "2º Mes",
        dosis: "1ª",
        biologicoSugerido: "Rotateq / Rotarix",
        matchKeywords: ["rotavirus", "rotateq", "rotarix"],
        dosisMatchKeywords: ["1", "1ª", "1ra", "primera", "2 mes", "2 meses"],
        enfermedadPrevenida: "ROTAVIRUS"
      },
      {
        id: "rota_2",
        categoriaId: "rotavirus",
        edad: "4º Mes",
        dosis: "2ª",
        biologicoSugerido: "Rotateq / Rotarix",
        matchKeywords: ["rotavirus", "rotateq", "rotarix"],
        dosisMatchKeywords: ["2", "2ª", "2da", "segunda", "4 mes", "4 meses"],
        enfermedadPrevenida: "ROTAVIRUS"
      },
      {
        id: "rota_3",
        categoriaId: "rotavirus",
        edad: "6º Mes",
        dosis: "3ª",
        biologicoSugerido: "Rotateq",
        matchKeywords: ["rotavirus", "rotateq", "rotarix"],
        dosisMatchKeywords: ["3", "3ª", "3ra", "tercera", "6 mes", "6 meses"],
        enfermedadPrevenida: "ROTAVIRUS"
      }
    ]
  },
  {
    id: "varicela",
    titulo: "VARICELA",
    badgeBg: "bg-violet-100/70",
    badgeText: "text-violet-900",
    badgeBorder: "border-violet-300",
    filas: [
      {
        id: "vari_1",
        categoriaId: "varicela",
        edad: "1 Año",
        dosis: "1ª",
        biologicoSugerido: "Varilrix / Varivax",
        matchKeywords: ["varicela", "varilrix", "varivax"],
        dosisMatchKeywords: ["1", "1ª", "1ra", "primera", "1 año", "12 meses"],
        enfermedadPrevenida: "VARICELA"
      },
      {
        id: "vari_2",
        categoriaId: "varicela",
        edad: "4 Años",
        dosis: "2ª",
        biologicoSugerido: "Varilrix / Varivax",
        matchKeywords: ["varicela", "varilrix", "varivax"],
        dosisMatchKeywords: ["2", "2ª", "2da", "segunda", "4 años", "5 años", "refuerzo"],
        enfermedadPrevenida: "VARICELA"
      }
    ]
  },
  {
    id: "hepa",
    titulo: "HEPATITIS A",
    badgeBg: "bg-cyan-100/70",
    badgeText: "text-cyan-900",
    badgeBorder: "border-cyan-300",
    filas: [
      {
        id: "hepa_1",
        categoriaId: "hepa",
        edad: "Entre 1 y 2 Años",
        dosis: "1ª",
        biologicoSugerido: "Avaxim / Havrix",
        matchKeywords: ["hepatitis a", "hepa", "hep a", "avaxim", "havrix"],
        dosisMatchKeywords: ["1", "1ª", "1ra", "primera", "unica", "1 año", "12 meses"],
        enfermedadPrevenida: "HEPATITIS A"
      },
      {
        id: "hepa_2",
        categoriaId: "hepa",
        edad: "6 Meses después de la 1ª",
        dosis: "2ª",
        biologicoSugerido: "Avaxim / Havrix",
        matchKeywords: ["hepatitis a", "hepa", "hep a", "avaxim", "havrix"],
        dosisMatchKeywords: ["2", "2ª", "2da", "segunda", "refuerzo", "6 meses"],
        enfermedadPrevenida: "HEPATITIS A"
      }
    ]
  },
  {
    id: "meningococo",
    titulo: "MENINGOCOCO",
    badgeBg: "bg-orange-100/70",
    badgeText: "text-orange-900",
    badgeBorder: "border-orange-300",
    filas: [
      {
        id: "meningo_1",
        categoriaId: "meningococo",
        edad: "Entre 9 a 12 Meses",
        dosis: "1ª",
        biologicoSugerido: "Nimenrix / MenQuadfi",
        matchKeywords: ["meningococo", "meningo", "nimenrix", "menactra", "menquadfi", "bexsero"],
        dosisMatchKeywords: ["1", "1ª", "1ra", "primera", "9 meses", "12 meses", "1 año"],
        enfermedadPrevenida: "MENINGOCOCO"
      },
      {
        id: "meningo_2",
        categoriaId: "meningococo",
        edad: "3 Meses después de la 1ª",
        dosis: "2ª",
        biologicoSugerido: "Nimenrix / MenQuadfi",
        matchKeywords: ["meningococo", "meningo", "nimenrix", "menactra", "menquadfi", "bexsero"],
        dosisMatchKeywords: ["2", "2ª", "2da", "segunda", "refuerzo", "3 meses"],
        enfermedadPrevenida: "MENINGOCOCO"
      }
    ]
  },
  {
    id: "vph",
    titulo: "VPH VIRUS PAPILOMA",
    badgeBg: "bg-purple-100/70",
    badgeText: "text-purple-900",
    badgeBorder: "border-purple-300",
    filas: [
      {
        id: "vph_1",
        categoriaId: "vph",
        edad: "A partir de los 9 Años",
        dosis: "1ª",
        biologicoSugerido: "Gardasil 9",
        matchKeywords: ["vph", "papiloma", "gardasil", "cervarix"],
        dosisMatchKeywords: ["1", "1ª", "1ra", "primera", "9 años"],
        enfermedadPrevenida: "VPH VIRUS PAPILOMA"
      },
      {
        id: "vph_2",
        categoriaId: "vph",
        edad: "2 Meses después de la 1ª",
        dosis: "2ª",
        biologicoSugerido: "Gardasil 9",
        matchKeywords: ["vph", "papiloma", "gardasil", "cervarix"],
        dosisMatchKeywords: ["2", "2ª", "2da", "segunda", "2 meses"],
        enfermedadPrevenida: "VPH VIRUS PAPILOMA"
      },
      {
        id: "vph_3",
        categoriaId: "vph",
        edad: "6 Meses después de la 1ª",
        dosis: "3ª",
        biologicoSugerido: "Gardasil 9",
        matchKeywords: ["vph", "papiloma", "gardasil", "cervarix"],
        dosisMatchKeywords: ["3", "3ª", "3ra", "tercera", "6 meses"],
        enfermedadPrevenida: "VPH VIRUS PAPILOMA"
      }
    ]
  },
  {
    id: "influenza",
    titulo: "INFLUENZA (GRIPE)",
    badgeBg: "bg-teal-100/70",
    badgeText: "text-teal-950",
    badgeBorder: "border-teal-300",
    filas: [
      {
        id: "influ_1",
        categoriaId: "influenza",
        edad: "A partir de los 6 Meses",
        dosis: "1ª",
        biologicoSugerido: "Fluarix / Vaxigrip",
        matchKeywords: ["influenza", "gripe", "fluarix", "vaxigrip", "fluzone"],
        dosisMatchKeywords: ["1", "1ª", "1ra", "primera", "6 meses"],
        enfermedadPrevenida: "INFLUENZA (GRIPE)"
      },
      {
        id: "influ_anual",
        categoriaId: "influenza",
        edad: "Cada Año",
        dosis: "Refuerzo",
        biologicoSugerido: "Fluarix / Vaxigrip Anual",
        matchKeywords: ["influenza", "gripe", "fluarix", "vaxigrip", "fluzone"],
        dosisMatchKeywords: ["refuerzo", "anual", "2", "2ª", "cada año"],
        enfermedadPrevenida: "INFLUENZA (GRIPE)"
      }
    ]
  }
];

/**
 * Función inteligente para emparejar registros de base de datos con las celdas de la matriz
 */
export function matchAplicacionFila(
  aplicaciones: any[],
  fila: FilaEsquema,
  claimedIds: Set<string>
): any | null {
  if (!aplicaciones || aplicaciones.length === 0) return null;

  // Normalizador de texto
  const norm = (str?: string) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  for (const app of aplicaciones) {
    if (claimedIds.has(app.id)) continue;

    const nombre = norm(app.nombre_vacuna);
    const enf = norm(app.enfermedad_prevenida);
    const dosis = norm(app.dosis);
    const edad = norm(app.edad_aplicacion);

    // 1. Coincidencia de categoría / biológico
    const matchCat = fila.matchKeywords.some(kw => {
      const nkw = norm(kw);
      return nombre.includes(nkw) || enf.includes(nkw);
    });

    if (!matchCat) continue;

    // 2. Coincidencia de dosis
    const matchDos = fila.dosisMatchKeywords.some(kw => {
      const nkw = norm(kw);
      return dosis.includes(nkw) || edad.includes(nkw);
    });

    if (matchDos) {
      claimedIds.add(app.id);
      return app;
    }
  }

  return null;
}

/**
 * Obtiene las vacunas adicionales que no coincidan con ninguna celda estándar ("OTRAS")
 */
export function getVacunasOtras(aplicaciones: any[], claimedIds: Set<string>): any[] {
  if (!aplicaciones) return [];
  return aplicaciones.filter(app => !claimedIds.has(app.id));
}

export interface HitoEdadPediatrica {
  id: string;
  titulo: string;
  subtitulo: string;
  edadMesesMin: number;
  edadMesesMax: number;
  badgeColor: string;
  bgLight: string;
  borderColor: string;
  icono: string;
  filasIds: string[];
}

/**
 * Hitos cronológicos de vacunación pediátrica para la vista gráfica / timeline de los padres
 */
export const HITOS_EDAD_PEDIATRICA: HitoEdadPediatrica[] = [
  {
    id: "rn",
    titulo: "Recién Nacido",
    subtitulo: "Primeras 24 - 48 horas de vida",
    edadMesesMin: 0,
    edadMesesMax: 1,
    badgeColor: "#065f46",
    bgLight: "#ecfdf5",
    borderColor: "#a7f3d0",
    icono: "🍼",
    filasIds: ["bcg_0", "hepb_rn"]
  },
  {
    id: "2m",
    titulo: "2º Mes",
    subtitulo: "A los 2 meses de edad (60 días)",
    edadMesesMin: 2,
    edadMesesMax: 3,
    badgeColor: "#0369a1",
    bgLight: "#f0f9ff",
    borderColor: "#bae6fd",
    icono: "👶",
    filasIds: ["polio_1", "hepb_2m", "hib_1", "dtp_1", "neumo_1", "rota_1"]
  },
  {
    id: "4m",
    titulo: "4º Mes",
    subtitulo: "A los 4 meses de edad (120 días)",
    edadMesesMin: 4,
    edadMesesMax: 5,
    badgeColor: "#1d4ed8",
    bgLight: "#eff6ff",
    borderColor: "#bfdbfe",
    icono: "👶",
    filasIds: ["polio_2", "hib_2", "dtp_2", "neumo_2", "rota_2"]
  },
  {
    id: "6m",
    titulo: "6º Mes",
    subtitulo: "A los 6 meses de edad (180 días)",
    edadMesesMin: 6,
    edadMesesMax: 8,
    badgeColor: "#4338ca",
    bgLight: "#eef2ff",
    borderColor: "#c7d2fe",
    icono: "👶",
    filasIds: ["polio_3", "hepb_6m", "hib_3", "dtp_3", "neumo_3", "rota_3", "influ_1"]
  },
  {
    id: "9m_12m",
    titulo: "9 a 12 Meses",
    subtitulo: "Entre los 9 y 12 meses",
    edadMesesMin: 9,
    edadMesesMax: 11,
    badgeColor: "#b45309",
    bgLight: "#fffbeb",
    borderColor: "#fde68a",
    icono: "🛡️",
    filasIds: ["meningo_1"]
  },
  {
    id: "12m",
    titulo: "1 Año (12 Meses)",
    subtitulo: "Al cumplir el primer año",
    edadMesesMin: 12,
    edadMesesMax: 17,
    badgeColor: "#be185d",
    bgLight: "#fdf2f8",
    borderColor: "#fbcfe8",
    icono: "🎂",
    filasIds: ["srp_1", "vari_1", "hepa_1", "fa_unica", "neumo_ref", "meningo_2"]
  },
  {
    id: "18m",
    titulo: "18 Meses (1er Refuerzo)",
    subtitulo: "1 año después de la 3ª dosis",
    edadMesesMin: 18,
    edadMesesMax: 47,
    badgeColor: "#6d28d9",
    bgLight: "#f5f3ff",
    borderColor: "#ddd6fe",
    icono: "🏃",
    filasIds: ["polio_ref1", "hib_ref", "dtp_ref1", "hepa_2"]
  },
  {
    id: "5a",
    titulo: "4 a 5 Años (2º Refuerzo)",
    subtitulo: "Refuerzos escolares previos a primaria",
    edadMesesMin: 48,
    edadMesesMax: 107,
    badgeColor: "#0f766e",
    bgLight: "#f0fdfa",
    borderColor: "#99f6e4",
    icono: "🎒",
    filasIds: ["polio_ref2", "dtp_ref2", "srp_2", "vari_2"]
  },
  {
    id: "9a",
    titulo: "9 Años en adelante",
    subtitulo: "Preadolescencia y refuerzos",
    edadMesesMin: 108,
    edadMesesMax: 999,
    badgeColor: "#7e22ce",
    bgLight: "#faf5ff",
    borderColor: "#e9d5ff",
    icono: "🧑",
    filasIds: ["vph_1", "vph_2", "vph_3", "influ_anual", "fa_refuerzo"]
  }
];

export function getFilaPorId(filaId: string): FilaEsquema | undefined {
  for (const cat of ESQUEMA_MATRIZ_CANONICO) {
    const f = cat.filas.find(row => row.id === filaId);
    if (f) return f;
  }
  return undefined;
}


