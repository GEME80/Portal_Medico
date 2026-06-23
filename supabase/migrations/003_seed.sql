-- ============================================================
-- EcoVaccine Platform — Seed inicial
-- Crea el tenant del Dr. Carlos Torres como tenant #1
-- Ejecutar DESPUÉS de 001_schema.sql y 002_rls.sql
-- ============================================================

-- ─── TENANT: Dr. Carlos Torres ──────────────────────────────
INSERT INTO tenants (id, slug, nombre, plan, activo)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'dr-torres',
  'Dr. Carlos Torres Martínez — Infectólogo Pediatra',
  'pro',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- ─── CONFIGURACIÓN DEL PORTAL ────────────────────────────────
INSERT INTO configuracion_portal (
  tenant_id,
  nombre_doctor, titulo_doctor, especialidad,
  nombre_clinica, bio_corta, bio_larga,
  hero_titulo, hero_subtitulo, hero_badge_texto,
  stat_anos_experiencia, stat_publicaciones, stat_pacientes_anio, stat_consultorios,
  email, telefono, whatsapp, ciudad, pais,
  color_primario, color_acento,
  meta_titulo, meta_descripcion
)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Dr. Carlos Torres Martínez',
  'Infectólogo Pediatra',
  'Infectología Pediátrica y Vacunología Clínica',
  'EcoVaccine Medical',
  'Infectólogo Pediatra con más de 30 años de experiencia en Colombia y Latinoamérica.',
  'Con más de 30 años dedicados a la infectología pediátrica y la vacunología molecular, el Dr. Torres ha construido una trayectoria de referencia en Colombia y Latinoamérica. Investigador activo, docente universitario y fundador del sistema EcoVaccine POS para digitalizar el control de inventario vacunal.',
  'Ciencia, prevención y cuidado para cada familia',
  'Infectología Pediátrica de vanguardia — Vacunación basada en evidencia',
  'Infectólogo · Vacunólogo · +30 años de experiencia',
  '30+', '50+', '2,000+', '3',
  'drtorres@ecovaccine.med', '+57 300 000 0000', '+57 300 000 0000', 'Bogotá', 'Colombia',
  '#0A4D5C', '#00D4AA',
  'Dr. Carlos Torres Martínez — Infectólogo Pediatra | EcoVaccine',
  'Portal médico del Dr. Carlos Torres Martínez, Infectólogo Pediatra con más de 30 años de experiencia. Vacunación basada en evidencia, EcoVaccine POS.'
)
ON CONFLICT (tenant_id) DO NOTHING;

-- ─── LÍNEAS DE INVESTIGACIÓN ─────────────────────────────────
INSERT INTO lineas_investigacion (tenant_id, icono, titulo, descripcion, orden) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '🦠', 'Infectología Pediátrica Avanzada', 'Diagnóstico y tratamiento de infecciones complejas en población pediátrica, con énfasis en patógenos emergentes y resistencia antimicrobiana.', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '💉', 'Vacunología Clínica y Molecular', 'Investigación en eficacia, seguridad e inmunogenicidad de vacunas en poblaciones especiales y grupos vulnerables de Colombia.', 2),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '📊', 'Epidemiología de Enfermedades Prevenibles', 'Análisis de brotes, cobertura vacunal y estrategias de intervención en salud pública para enfermedades prevenibles por vacunación.', 3),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '🔬', 'Hesitación Vacunal y Comunicación en Salud', 'Estudio de los factores determinantes de la hesitación vacunal y desarrollo de estrategias de comunicación basadas en evidencia.', 4)
ON CONFLICT DO NOTHING;

-- ─── HITOS TIMELINE ──────────────────────────────────────────
INSERT INTO hitos_timeline (tenant_id, anio, titulo, institucion, orden) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '1994', 'Médico Cirujano', 'Universidad Nacional de Colombia', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '1998', 'Especialista en Pediatría', 'Hospital de la Misericordia, Bogotá', 2),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2002', 'Fellowship en Infectología Pediátrica', 'Hospital Garrahan, Buenos Aires', 3),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2008', 'Máster en Epidemiología', 'Universidad de los Andes', 4),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2015', 'Investigador Asociado OPS/OMS', 'Programa Ampliado de Inmunizaciones EPI', 5),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2020', 'Fundador EcoVaccine POS', 'Sistema de control de inventario vacunal', 6)
ON CONFLICT DO NOTHING;

-- ─── MITOS VACUNALES ─────────────────────────────────────────
INSERT INTO mitos_vacunales (tenant_id, mito, respuesta, fuente, orden) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Las vacunas causan autismo',
   'Este mito proviene de un estudio de 1998 (Wakefield et al.) que fue retractado por la revista Lancet y cuyo autor perdió su licencia médica por fraude científico. Más de 50 estudios con más de 1 millón de niños confirman que no existe ninguna asociación entre vacunas y trastorno del espectro autista.',
   'Taylor et al. (2014) — Vaccine. DOI: 10.1016/j.vaccine.2014.03.055', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Las vacunas debilitan el sistema inmunológico',
   'Al contrario, las vacunas entrenan al sistema inmunológico sin causar enfermedad grave. El sistema inmune de un bebé puede manejar más de 10.000 antígenos simultáneamente. Las vacunas del esquema PAI representan menos del 0.1% de esa capacidad.',
   'Plotkin SA. (2014) — Clinical Infectious Diseases. DOI: 10.1093/cid/ciu428', 2),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Es mejor que mi hijo adquiera inmunidad natural',
   'La inmunidad natural a ciertas enfermedades viene a un costo inaceptable: complicaciones graves, hospitalizaciones y muerte. El sarampión causa encefalitis en 1 de cada 1.000 casos. La vacuna MMR genera una respuesta inmune comparable sin los riesgos de la enfermedad natural.',
   'CDC MMWR (2023). Measles, Mumps, and Rubella — Vaccine Recommendations', 3),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Las vacunas contienen mercurio y sustancias peligrosas',
   'El thiomersal fue retirado de las vacunas pediátricas desde 2001. El etilmercurio es procesado y eliminado por el organismo rápidamente. Los adyuvantes como el aluminio están en concentraciones menores a las que consumimos en la dieta diaria.',
   'WHO Statement on Thiomersal (2021). Vaccine Safety Advisory Committee', 4),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Si todos los demás se vacunan, mi hijo no necesita hacerlo',
   'La inmunidad de rebaño funciona solo cuando el 90-95% de la población está protegida. Los niños no vacunados además contagian a bebés menores de 6 meses que aún no pueden vacunarse.',
   'Instituto Nacional de Salud Colombia — Informe Epidemiológico 2019', 5),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Las vacunas se administran demasiado pronto',
   'El esquema está diseñado para proteger en los momentos de mayor vulnerabilidad. La Hepatitis B se administra al nacer porque el riesgo de infección crónica es del 90% si un neonato se contagia vs <5% en adultos.',
   'American Academy of Pediatrics — Red Book (2024)', 6)
ON CONFLICT DO NOTHING;

-- ─── VACUNAS INICIALES ───────────────────────────────────────
INSERT INTO inventario_vacunas (tenant_id, nombre, nombre_generico, laboratorio, enfermedad, via_admin, esquema_dosis, stock_actual, stock_minimo, precio_venta, temperatura) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Hepatitis B', 'Vacuna recombinante HBsAg', 'GSK Biologicals', 'Hepatitis B crónica', 'Intramuscular', '3 dosis: RN, 2, 6 meses', 24, 10, 45000, '2-8°C'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pentavalente', 'DPT-HB-Hib', 'Sanofi Pasteur', 'Difteria, Pertussis, Tétanos, HB, Hib', 'Intramuscular', '3 dosis + refuerzos (2, 4, 6, 18 meses)', 8, 15, 68000, '2-8°C'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Neumococo PCV13', 'Vacuna Neumocócica Conjugada 13-valente', 'Pfizer', 'Neumonía, meningitis, otitis por S. pneumoniae', 'Intramuscular', '3 dosis: 2, 4, 12 meses', 0, 8, 120000, '2-8°C'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'MMR (SRP)', 'Vacuna Sarampión-Rubéola-Paperas', 'MSD Vacunas', 'Sarampión, Rubéola, Parotiditis', 'Subcutánea', '2 dosis: 12 y 18 meses', 12, 10, 55000, '2-8°C')
ON CONFLICT DO NOTHING;
