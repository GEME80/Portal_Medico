export interface PlantillaVacuna {
  nombre: string;
  enfermedad: string;
  edad: string;
  via: string;
  sitio: string;
  dosisDefecto: string;
}

/**
 * Plantillas estándar de esquemas vacunales (PAI Colombia + Esquema Pediátrico Ampliado)
 */
export const PLANTILLAS_VACUNAS: PlantillaVacuna[] = [
  { nombre: "BCG (Tuberculosis)", enfermedad: "Tuberculosis Meníngea y Miliar", edad: "Recién Nacido", via: "Intradérmica", sitio: "Deltoides derecho", dosisDefecto: "Única" },
  { nombre: "Hepatitis B Pediátrica", enfermedad: "Hepatitis B", edad: "Recién Nacido", via: "Intramuscular", sitio: "Vasto externo muslo", dosisDefecto: "Recién Nacido" },
  { nombre: "Hexavalente Acelular", enfermedad: "Difteria, Tétanos, Tosferina, Hib, Hep B, Polio", edad: "2 Meses", via: "Intramuscular", sitio: "Vasto externo muslo", dosisDefecto: "1ra Dosis" },
  { nombre: "Pentavalente", enfermedad: "Difteria, Tétanos, Tosferina, Hepatitis B, Hib", edad: "2 Meses", via: "Intramuscular", sitio: "Vasto externo muslo", dosisDefecto: "1ra Dosis" },
  { nombre: "Polio Inyectable (IPV)", enfermedad: "Poliomielitis", edad: "2 Meses", via: "Intramuscular", sitio: "Vasto externo muslo", dosisDefecto: "1ra Dosis" },
  { nombre: "Rotavirus", enfermedad: "Diarrea por Rotavirus", edad: "2 Meses", via: "Oral", sitio: "Vía oral", dosisDefecto: "1ra Dosis" },
  { nombre: "Neumococo Conjugada", enfermedad: "Neumonía, Meningitis, Otitis por S. Pneumoniae", edad: "2 Meses", via: "Intramuscular", sitio: "Vasto externo muslo", dosisDefecto: "1ra Dosis" },
  { nombre: "Meningococo B / ACWY", enfermedad: "Enfermedad Meningocócica Invasiva", edad: "3 Meses", via: "Intramuscular", sitio: "Vasto externo muslo", dosisDefecto: "1ra Dosis" },
  { nombre: "Influenza Estacional", enfermedad: "Gripe / Influenza A y B", edad: "6 Meses", via: "Intramuscular", sitio: "Vasto externo muslo", dosisDefecto: "1ra Dosis" },
  { nombre: "Triple Viral (SRP)", enfermedad: "Sarampión, Rubeola, Paperas", edad: "12 Meses", via: "Subcutánea", sitio: "Deltoides brazo", dosisDefecto: "1ra Dosis" },
  { nombre: "Varicela", enfermedad: "Varicela", edad: "12 Meses", via: "Subcutánea", sitio: "Deltoides brazo", dosisDefecto: "1ra Dosis" },
  { nombre: "Hepatitis A", enfermedad: "Hepatitis A", edad: "12 Meses", via: "Intramuscular", sitio: "Deltoides brazo", dosisDefecto: "Única" },
  { nombre: "Fiebre Amarilla", enfermedad: "Fiebre Amarilla", edad: "18 Meses", via: "Subcutánea", sitio: "Deltoides brazo", dosisDefecto: "Dosis Única" },
  { nombre: "DPT (Difteria, Tétanos, Tosferina)", enfermedad: "Difteria, Tétanos, Tosferina", edad: "18 Meses", via: "Intramuscular", sitio: "Deltoides brazo", dosisDefecto: "1er Refuerzo" },
  { nombre: "VPH (Virus Papiloma Humano)", enfermedad: "Cáncer de cuello uterino y verrugas genitales", edad: "9 Años", via: "Intramuscular", sitio: "Deltoides brazo", dosisDefecto: "1ra Dosis" },
  { nombre: "Dengue (Atenuada)", enfermedad: "Fiebre por Dengue y formas graves", edad: "4 Años en adelante", via: "Subcutánea", sitio: "Deltoides brazo", dosisDefecto: "1ra Dosis" },
  { nombre: "COVID-19 Bivalente/Actualizada", enfermedad: "SARS-CoV-2", edad: "6 Meses en adelante", via: "Intramuscular", sitio: "Deltoides brazo", dosisDefecto: "Dosis Actualizada" },
];
