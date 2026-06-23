"use client";
import Link from "next/link";

const myths = [
  {
    myth: "Las vacunas causan autismo",
    answer:
      "Este mito proviene de un estudio de 1998 (Wakefield et al.) que fue retractado por la revista Lancet y cuyo autor perdió su licencia médica por fraude científico. Más de 50 estudios con más de 1 millón de niños, incluyendo el meta-análisis de Taylor et al. (2014) en Vaccine, confirman que no existe ninguna asociación entre vacunas y trastorno del espectro autista.",
    source: "Taylor et al. (2014) — Vaccine. DOI: 10.1016/j.vaccine.2014.03.055"
  },
  {
    myth: "Las vacunas debilitan el sistema inmunológico",
    answer:
      "Al contrario, las vacunas entrenan al sistema inmunológico sin causar enfermedad grave. El sistema inmune de un bebé puede manejar más de 10.000 antígenos simultáneamente. Las vacunas del esquema PAI representan menos del 0.1% de esa capacidad. El Dr. Plotkin, padre de la vacunología moderna, describió este proceso como 'educación controlada del sistema inmune'.",
    source: "Plotkin SA. (2014) — Clinical Infectious Diseases. DOI: 10.1093/cid/ciu428"
  },
  {
    myth: "Es mejor que mi hijo adquiera inmunidad natural",
    answer:
      "La inmunidad natural a ciertas enfermedades viene a un costo inaceptable: complicaciones graves, hospitalizaciones y muerte. El sarampión, por ejemplo, causa encefalitis en 1 de cada 1.000 casos y muerte en 1-2 por 1.000 en países desarrollados. La vacuna MMR genera una respuesta inmune comparable sin los riesgos de la enfermedad natural.",
    source: "CDC MMWR (2023). Measles, Mumps, and Rubella — Vaccine Recommendations"
  },
  {
    myth: "Las vacunas contienen mercurio y sustancias peligrosas",
    answer:
      "El thiomersal (que contiene etilmercurio) fue retirado de las vacunas pediátricas desde 2001 como precaución, aunque los estudios no demostraron daño. El metilmercurio (peligroso) y el etilmercurio son químicamente diferentes: el segundo es procesado y eliminado por el organismo rápidamente. Los adyuvantes como el aluminio están en concentraciones menores a las que consumimos en la dieta diaria.",
    source: "WHO Statement on Thiomersal (2021). Vaccine Safety Advisory Committee"
  },
  {
    myth: "Si todos los demás se vacunan, mi hijo no necesita hacerlo",
    answer:
      "La inmunidad de rebaño funciona solo cuando el 90-95% de la población está protegida. Si cada padre toma esta decisión individualmente, la cobertura cae por debajo del umbral crítico y las enfermedades regresan, como ocurrió con el sarampión en Colombia en 2018 (brote de 200+ casos tras años sin circulación). Los niños no vacunados además contagian a bebés menores de 6 meses que aún no pueden vacunarse.",
    source: "Instituto Nacional de Salud Colombia — Informe Epidemiológico 2019"
  },
  {
    myth: "Las vacunas se administran demasiado pronto",
    answer:
      "El esquema de vacunación está diseñado por expertos para proteger en los momentos de mayor vulnerabilidad. Por ejemplo, la Hepatitis B se administra al nacer porque el riesgo de infección crónica es del 90% si un neonato se contagia, versus <5% en adultos. La edad de cada vacuna no es arbitraria: está basada en epidemiología, inmunogenicidad y patrones de exposición.",
    source: "American Academy of Pediatrics — Red Book (2024)"
  },
  {
    myth: "Las enfermedades que previenen las vacunas ya desaparecieron",
    answer:
      "Estas enfermedades no han desaparecido: están controladas precisamente gracias a la vacunación. El poliovirus salvaje, erradicado en las Américas desde 1991, sigue circulando en Afganistán y Pakistán. El sarampión tuvo un rebrote global en 2019 con más de 869.000 casos reportados cuando la cobertura vacunal cayó. La erradicación total requiere mantener altas tasas de cobertura.",
    source: "OMS — Informe Mundial de Inmunización 2023"
  },
  {
    myth: "Las empresas farmacéuticas no pueden ser confiables",
    answer:
      "La confianza en las vacunas no descansa en las farmacéuticas sino en los organismos regulatorios independientes: FDA (EE.UU.), EMA (Europa), INVIMA (Colombia), y la OMS. El proceso de aprobación de una vacuna toma en promedio 10-15 años e incluye ensayos clínicos con decenas de miles de participantes antes de llegar al mercado. La farmacovigilancia posterior continúa durante toda la vida útil del producto.",
    source: "INVIMA Colombia — Marco Regulatorio de Vacunas (2023)"
  },
];

const vaccines = [
  {
    icon: "💉",
    name: "Hepatitis B",
    doses: "3 dosis (RN, 2, 6 meses)",
    protection: "95%+",
    lab: "GSK / MSD",
    desc: "Previene la infección por virus hepatitis B y sus complicaciones: cirrosis y carcinoma hepatocelular.",
    available: true,
  },
  {
    icon: "🛡️",
    name: "Pentavalente (DPT-HB-Hib)",
    doses: "3 dosis (2, 4, 6 meses) + refuerzos",
    protection: "97%+",
    lab: "Sanofi Pasteur",
    desc: "Protege contra difteria, pertussis, tétanos, hepatitis B y Haemophilus influenzae tipo b simultáneamente.",
    available: true,
  },
  {
    icon: "🔬",
    name: "Neumococo PCV13",
    doses: "3 dosis (2, 4, 12 meses)",
    protection: "90%+",
    lab: "Pfizer",
    desc: "Previene neumonía, meningitis y otitis media causadas por Streptococcus pneumoniae en 13 serotipos.",
    available: true,
  },
  {
    icon: "🧬",
    name: "MMR (Sarampión-Rubéola-Paperas)",
    doses: "2 dosis (12 meses, 18 meses)",
    protection: "97%+",
    lab: "MSD Vacunas",
    desc: "Vacuna combinada triple viral. Erradicó el sarampión endémico de las Américas en 2016.",
    available: false,
  },
  {
    icon: "💊",
    name: "Rotavirus",
    doses: "2 dosis (2, 4 meses) — oral",
    protection: "85-98%+",
    lab: "GSK Biologicals",
    desc: "Previene gastroenteritis grave por rotavirus, principal causa de hospitalización por diarrea en lactantes.",
    available: true,
  },
  {
    icon: "⭐",
    name: "Varicela",
    doses: "2 dosis (12 meses, 18 meses)",
    protection: "98%+",
    lab: "MSD Vacunas",
    desc: "Previene la varicela y reduce el riesgo de herpes zóster (culebrilla) en etapas adultas.",
    available: true,
  },
];

export default function VacunasPage() {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(160deg, var(--teal-950), var(--teal-900) 60%, var(--slate-900))",
        padding: "80px 0 100px",
        position: "relative",
        overflow: "hidden",
      }} aria-label="EcoVaccine — Vacunación Segura">
        <div className="hero-bg-grid" aria-hidden="true"/>
        <div className="hero-glow-1" aria-hidden="true" style={{ opacity: 0.6 }}/>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="text-center" style={{ maxWidth: "700px", margin: "0 auto" }}>
            <div className="hero-kicker" style={{ display: "inline-flex", margin: "0 auto 20px" }}>
              <span className="pulse-dot"/>
              💉 EcoVaccine — Vacunación Basada en Evidencia
            </div>
            <h1 style={{
              fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 900,
              color: "white", letterSpacing: "-.03em", marginBottom: "20px",
              fontFamily: "Outfit, sans-serif", lineHeight: 1.05
            }}>
              Vacunas seguras,<br/>
              <span className="hero-title-accent">niños protegidos</span>
            </h1>
            <p style={{ fontSize: "17px", color: "rgba(255,255,255,.65)", lineHeight: 1.7, marginBottom: "32px" }}>
              El Dr. Torres responde con evidencia científica los mitos más comunes sobre la vacunación.
              Basado en publicaciones indexadas y guías de la OPS/OMS.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="#mitos" className="btn btn-emerald">
                Decodificador de Mitos
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
              </a>
              <a href="/noticias" className="btn btn-ghost">Ver publicaciones científicas</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── MYTH DECODER ────────────────────────────────────────────── */}
      <section className="section" id="mitos" aria-label="Decodificador de mitos sobre vacunación">
        <div className="container">
          <div className="text-center mb-8">
            <span className="badge badge-rose mb-4" style={{ display: "inline-flex" }}>
              🔍 Basado en Evidencia Molecular
            </span>
            <h2 className="section-heading">
              Decodificador de<br/>
              <span className="text-teal">Mitos Vacunales</span>
            </h2>
            <p className="section-sub mt-4" style={{ maxWidth: "560px", margin: "16px auto 0" }}>
              El Dr. Torres responde punto a punto los {myths.length} mitos más frecuentes
              que los padres traen a la consulta, con fuentes científicas verificables.
            </p>
          </div>

          <div className="myth-accordion" role="list">
            {myths.map((item, i) => (
              <details className="myth-item" key={i} role="listitem">
                <summary className="myth-summary" id={`myth-${i}`}>
                  <div className="myth-summary-left">
                    <div className="myth-number">{String(i + 1).padStart(2, "0")}</div>
                    <span>❌ Mito: &quot;{item.myth}&quot;</span>
                  </div>
                  <svg className="myth-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </summary>
                <div className="myth-body">
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "10px" }}>
                    <span style={{ fontSize: "16px", flexShrink: 0 }}>✅</span>
                    <p>{item.answer}</p>
                  </div>
                  <p className="myth-source">📚 Fuente: {item.source}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>


      {/* ── ADMIN CTA ────────────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--slate-50)" }} aria-label="Sistema EcoVaccine para profesionales">
        <div className="container">
          <div style={{
            background: "linear-gradient(135deg, var(--teal-900), var(--teal-800))",
            borderRadius: "var(--radius-2xl)", padding: "60px 48px",
            display: "grid", gridTemplateColumns: "1fr auto", gap: "40px", alignItems: "center",
          }}>
            <div>
              <span className="badge mb-4" style={{ background: "rgba(0,212,170,.15)", border: "1px solid rgba(0,212,170,.3)", color: "var(--emerald-400)", display: "inline-flex", marginBottom: "16px" }}>
                💉 EcoVaccine POS — Solo para profesionales
              </span>
              <h2 style={{ fontSize: "28px", fontWeight: 900, color: "white", marginBottom: "12px", fontFamily: "Outfit, sans-serif" }}>
                Control de inventario vacunal
              </h2>
              <p style={{ color: "rgba(255,255,255,.65)", fontSize: "15px", lineHeight: 1.7, maxWidth: "480px" }}>
                El sistema EcoVaccine POS para registro de lotes, control de stock en tiempo real,
                alertas de reorden y trazabilidad de dosis es exclusivo del panel de administración.
              </p>
            </div>
            <a href="/admin/vacunas" className="btn btn-emerald" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
              Ir al Panel Admin
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(135deg, var(--teal-800), var(--teal-600))",
        padding: "80px 0", textAlign: "center", position: "relative", overflow: "hidden",
      }} aria-label="Consulta al Dr. Torres">
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(0,212,170,.15) 0%, transparent 60%)" }}/>
        <div className="container" style={{ position: "relative", zIndex: 1, maxWidth: "580px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "white", marginBottom: "16px", fontFamily: "Outfit, sans-serif" }}>
            ¿Tienes dudas sobre la vacunación de tu hijo?
          </h2>
          <p style={{ color: "rgba(255,255,255,.75)", fontSize: "16px", lineHeight: 1.7, marginBottom: "32px" }}>
            El Dr. Torres atiende consultas sobre esquemas vacunales, reacciones adversas y
            contraindicaciones. La salud de tu hijo es nuestra prioridad.
          </p>
          <a href="mailto:drtorres@ecovaccine.med" className="btn" style={{
            background: "white", color: "var(--teal-800)", fontWeight: 800,
            padding: "16px 36px", fontSize: "16px",
            boxShadow: "0 12px 40px rgba(0,0,0,.2)",
          }}>
            Consultar al Dr. Torres →
          </a>
        </div>
      </section>
    </>
  );
}
