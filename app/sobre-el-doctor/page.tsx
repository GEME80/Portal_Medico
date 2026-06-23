"use client";
import Image from "next/image";
import Link from "next/link";


const credentials = [
  { icon: "🎓", title: "Médico Cirujano", detail: "Universidad Nacional de Colombia, 1994" },
  { icon: "👶", title: "Especialista en Pediatría", detail: "Hospital de la Misericordia, Bogotá, 1998" },
  { icon: "🦠", title: "Fellowship en Infectología Pediátrica", detail: "Hospital Garrahan, Buenos Aires, 2002" },
  { icon: "📊", title: "Máster en Epidemiología", detail: "Universidad de los Andes, 2008" },
  { icon: "🌐", title: "Investigador Asociado OPS/OMS", detail: "Programa Ampliado de Inmunizaciones EPI, 2015" },
];

const publications = [
  {
    year: "2026",
    title: "Eficacia de vacunas ARNm en menores de 5 años: revisión sistemática de 42 estudios clínicos (2021–2026)",
    journal: "Vaccine · DOI: 10.1016/j.vaccine.2026.001",
    category: "Académico",
  },
  {
    year: "2025",
    title: "Hesitación vacunal en Colombia: factores determinantes y estrategias de intervención basadas en evidencia",
    journal: "Revista Colombiana de Infectología · Vol. 29, N°4",
    category: "Prevención",
  },
  {
    year: "2025",
    title: "Brote de sarampión en zona andina: correlación entre cobertura vacunal y mortalidad infantil",
    journal: "Biomédica · DOI: 10.7705/biomedica.2025",
    category: "Epidemiología",
  },
  {
    year: "2024",
    title: "Respuesta inmune ante Neumococo PCV13 en población indígena colombiana: estudio de cohorte",
    journal: "PLOS ONE · DOI: 10.1371/journal.pone.2024",
    category: "Académico",
  },
  {
    year: "2024",
    title: "Seguridad y reactogenicidad de la vacuna Pentavalente en lactantes: metaanálisis 2023-2024",
    journal: "Pediatric Infectious Disease Journal · Vol. 43, N°2",
    category: "Académico",
  },
];

const affiliations = [
  { name: "Sociedad Colombiana de Infectología", abbr: "SCI" },
  { name: "Sociedad Latinoamericana de Infectología Pediátrica", abbr: "SLIPE" },
  { name: "Organización Panamericana de la Salud", abbr: "OPS/OMS" },
  { name: "International Society for Infectious Diseases", abbr: "ISID" },
  { name: "Asociación Colombiana de Pediatría", abbr: "SCP" },
];

export default function SobreElDoctorPage() {
  return (
    <>
      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(160deg, var(--teal-950), var(--teal-900) 60%, var(--slate-900))",
          padding: "80px 0 100px",
          position: "relative",
          overflow: "hidden",
        }}
        aria-label="Perfil del doctor"
      >
        <div className="hero-bg-grid" aria-hidden="true"/>
        <div className="hero-glow-1" aria-hidden="true" style={{ opacity: 0.5 }}/>

        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "64px", alignItems: "center" }}>
            {/* Photo */}
            <div className="animate-left" style={{ position: "relative" }}>
              <div style={{
                borderRadius: "var(--radius-2xl)",
                overflow: "hidden",
                boxShadow: "0 40px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.08)",
              }}>
                <Image
                  src="/doctor-torres.png"
                  alt="Dr. Carlos Torres Martínez"
                  width={460}
                  height={460}
                  priority
                  style={{ width: "100%", height: "460px", objectFit: "cover", objectPosition: "center top" }}
                />
              </div>
              {/* Floating card */}
              <div style={{
                position: "absolute", bottom: "24px", left: "-24px",
                background: "rgba(255,255,255,.10)", backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,.18)", borderRadius: "var(--radius-lg)",
                padding: "14px 18px", color: "white",
                boxShadow: "0 8px 32px rgba(0,0,0,.3)",
              }}>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,.6)", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>Miembro activo</div>
                <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "Outfit, sans-serif" }}>OPS/OMS · SLIPE · SCI</div>
              </div>
            </div>

            {/* Info */}
            <div className="animate-right delay-200" style={{ color: "white" }}>
              <div className="hero-kicker" style={{ marginBottom: "20px" }}>
                <span className="pulse-dot"/>
                Perfil Académico y Clínico
              </div>
              <h1 className="hero-title" style={{ marginBottom: "12px" }}>
                Dr. Carlos Torres<br/>
                <span className="hero-title-accent">Martínez</span>
              </h1>
              <p style={{ fontSize: "18px", color: "var(--emerald-300)", fontWeight: 700, marginBottom: "20px", fontFamily: "Outfit, sans-serif" }}>
                Infectólogo Pediatra · Vacunólogo Clínico
              </p>
              <p style={{ fontSize: "16px", color: "rgba(255,255,255,.65)", lineHeight: 1.75, marginBottom: "32px" }}>
                Con más de 30 años dedicados a la infectología pediátrica y la vacunología molecular,
                el Dr. Torres ha construido una trayectoria de referencia en Colombia y Latinoamérica.
                Investigador activo, docente universitario y fundador del sistema EcoVaccine POS para
                digitalizar el control de inventario vacunal en consultorios.
              </p>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <a href="mailto:drtorres@ecovaccine.med" className="btn btn-emerald">
                  Contactar al Doctor
                </a>
                <Link href="/noticias" className="btn btn-ghost">
                  Ver publicaciones
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CREDENTIALS GRID ────────────────────────────────────────── */}
      <section className="section" aria-label="Credenciales académicas">
        <div className="container">
          <div className="text-center mb-8">
            <span className="badge badge-teal mb-4" style={{ display: "inline-flex" }}>Formación Académica</span>
            <h2 className="section-heading">Credenciales y<br/><span className="text-teal">formación especializada</span></h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {credentials.map((c, i) => (
              <div key={i} className="card" style={{ padding: "24px" }}>
                <div style={{
                  width: "52px", height: "52px",
                  background: "linear-gradient(135deg, var(--teal-50), var(--teal-100))",
                  borderRadius: "var(--radius-md)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "24px", marginBottom: "16px"
                }}>{c.icon}</div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px", fontFamily: "Outfit, sans-serif" }}>{c.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--slate-500)", lineHeight: 1.5 }}>{c.detail}</p>
              </div>
            ))}
            {/* EcoVaccine card */}
            <div className="card" style={{
              padding: "24px",
              background: "linear-gradient(135deg, var(--teal-900), var(--teal-800))",
              borderColor: "var(--teal-700)",
            }}>
              <div style={{
                width: "52px", height: "52px",
                background: "rgba(0,212,170,.2)",
                borderRadius: "var(--radius-md)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "24px", marginBottom: "16px"
              }}>💉</div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px", fontFamily: "Outfit, sans-serif", color: "white" }}>Fundador EcoVaccine</h3>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,.6)", lineHeight: 1.5 }}>Sistema POS de control de inventario vacunal, 2020 — presente</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PUBLICATIONS ────────────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--slate-50)" }} aria-label="Publicaciones académicas">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <span className="badge badge-emerald mb-4" style={{ display: "inline-flex" }}>Publicaciones Seleccionadas</span>
              <h2 className="section-heading">Investigación científica<br/><span className="text-teal">publicada</span></h2>
            </div>
            <Link href="/noticias" className="btn btn-outline">Ver todas →</Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {publications.map((pub, i) => (
              <div key={i} style={{
                background: "white",
                border: "1px solid var(--slate-200)",
                borderRadius: "var(--radius-lg)",
                padding: "24px",
                display: "flex",
                gap: "20px",
                alignItems: "flex-start",
                transition: "border-color .2s, box-shadow .2s",
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(10,77,92,.3)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--slate-200)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div style={{
                  fontSize: "13px", fontWeight: 800, color: "var(--teal-700)",
                  fontFamily: "Outfit, sans-serif", letterSpacing: ".04em",
                  background: "var(--teal-50)", padding: "6px 12px",
                  borderRadius: "var(--radius-sm)", flexShrink: 0,
                }}>{pub.year}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: "6px" }}>
                    <span className={`badge ${
                      pub.category === "Académico" ? "badge-teal" :
                      pub.category === "Epidemiología" ? "badge-rose" : "badge-emerald"
                    }`}>{pub.category}</span>
                  </div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "6px", fontFamily: "Outfit, sans-serif", lineHeight: 1.4 }}>
                    {pub.title}
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--slate-500)" }}>{pub.journal}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AFFILIATIONS ────────────────────────────────────────────── */}
      <section className="section" aria-label="Afiliaciones profesionales">
        <div className="container">
          <div className="text-center mb-8">
            <span className="badge badge-teal mb-4" style={{ display: "inline-flex" }}>Membresías</span>
            <h2 className="section-heading">Afiliaciones<br/><span className="text-teal">internacionales</span></h2>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "center" }}>
            {affiliations.map((a, i) => (
              <div key={i} style={{
                background: "white", border: "1px solid var(--slate-200)",
                borderRadius: "var(--radius-full)",
                padding: "14px 24px",
                display: "flex", alignItems: "center", gap: "12px",
                boxShadow: "var(--shadow-sm)",
                transition: "border-color .2s, transform .2s",
                cursor: "default",
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--teal-300)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--slate-200)";
                  (e.currentTarget as HTMLElement).style.transform = "none";
                }}
              >
                <span style={{
                  background: "var(--teal-800)", color: "white",
                  padding: "4px 10px", borderRadius: "var(--radius-sm)",
                  fontSize: "11px", fontWeight: 800, fontFamily: "Outfit, sans-serif",
                  letterSpacing: ".04em",
                }}>{a.abbr}</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--slate-700)" }}>{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
