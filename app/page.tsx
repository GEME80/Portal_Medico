import Image from "next/image";
import Link from "next/link";

// ─── MOCK DATA ──────────────────────────────────────────────────────────
const mockAlerts = [
  {
    id: 1,
    level: "warning",
    icon: "⚠️",
    title: "Alerta Epidemiológica: Aumento de casos de sarampión en zona norte",
    desc: "Se reporta incremento del 18% en casos confirmados. Se recomienda verificar esquema de vacunación."
  }
];

const researchLines = [
  {
    icon: "🧬",
    title: "Vacunología Molecular",
    desc: "Investigación sobre respuesta inmune adaptativa en población pediátrica menor de 5 años."
  },
  {
    icon: "🦠",
    title: "Epidemiología de Enfermedades Emergentes",
    desc: "Vigilancia y control de brotes de enfermedades inmunoprevenibles en Colombia."
  },
  {
    icon: "🔬",
    title: "Inmunología Clínica Avanzada",
    desc: "Evaluación de nuevas plataformas de vacunas ARNm en pediatría."
  },
  {
    icon: "📊",
    title: "Reticencia Vacunal",
    desc: "Estrategias basadas en evidencia para mitigar la hesitación ante la vacunación."
  }
];

const timeline = [
  { year: "1994", title: "Médico Cirujano", sub: "Universidad Nacional de Colombia" },
  { year: "1998", title: "Especialización en Pediatría", sub: "Hospital de la Misericordia, Bogotá" },
  { year: "2002", title: "Fellowship en Infectología Pediátrica", sub: "Hospital Garrahan, Buenos Aires" },
  { year: "2008", title: "Máster en Epidemiología", sub: "Universidad de los Andes" },
  { year: "2015", title: "Investigador Asociado", sub: "OPS/OMS — Programa EPI" },
  { year: "2020", title: "Fundación EcoVaccine", sub: "Sistema de control de inventario vacunal" },
];

const mockNews = [
  {
    slug: "vacunacion-arn-mrna-pediatrica",
    emoji: "🧬",
    category: "Académico",
    date: "15 Jun 2026",
    title: "Eficacia y seguridad de las vacunas ARNm en población pediátrica: revisión sistemática 2026",
    excerpt: "Análisis de 42 estudios clínicos publicados entre 2021-2026. Los datos confirman un perfil de seguridad robusto con eficacia ≥ 94% en menores de 5 años.",
  },
  {
    slug: "brote-sarampion-colombia",
    emoji: "⚠️",
    category: "Epidemiología",
    date: "10 Jun 2026",
    title: "Análisis del brote de sarampión en la región andina: lecciones para la política de salud pública",
    excerpt: "Estudio retrospectivo del brote 2025-2026 revela correlación directa entre hesitación vacunal y mortalidad infantil en zonas rurales.",
  },
  {
    slug: "ecovaccine-control-inventario",
    emoji: "💉",
    category: "EcoVaccine",
    date: "5 Jun 2026",
    title: "EcoVaccine POS: Digitalizando el control de inventario vacunal en consultorios de bajo recurso",
    excerpt: "Resultados piloto en 12 consultorios de Bogotá muestran reducción del 67% en pérdida de dosis por vencimiento y desabastecimiento.",
  },
];

const vaccines = [
  { icon: "💉", name: "Hepatitis B", lab: "GSK Biologicals", status: "ok" },
  { icon: "🛡️", name: "Pentavalente", lab: "Sanofi Pasteur", status: "ok" },
  { icon: "🔬", name: "Neumococo PCV13", lab: "Pfizer", status: "ok" },
  { icon: "🧬", name: "MMR (SRP)", lab: "MSD", status: "alert" },
  { icon: "💊", name: "Rotavirus", lab: "GSK Biologicals", status: "ok" },
  { icon: "⭐", name: "Varicela", lab: "MSD Vacunas", status: "ok" },
];

// ─── COMPONENT ──────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      {/* ── ALERT BANNER ───────────────────────────────────────────── */}
      {mockAlerts.map((alert) => (
        <div key={alert.id} className={`alert-banner level-${alert.level}`}>
          <div className="container">
            <div className="alert-inner">
              <span className="alert-icon">{alert.icon}</span>
              <div className="alert-content">
                <p className="alert-title">{alert.title}</p>
                <p className="alert-desc">{alert.desc}</p>
              </div>
              <span className="badge badge-amber">Actualizado</span>
            </div>
          </div>
        </div>
      ))}

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="hero" id="inicio" aria-label="Presentación del Dr. Carlos Torres">
        <div className="hero-bg-grid" aria-hidden="true"/>
        <div className="hero-glow-1" aria-hidden="true"/>
        <div className="hero-glow-2" aria-hidden="true"/>

        <div className="container">
          <div className="hero-inner">
            {/* Content */}
            <div className="hero-content animate-left">
              <div className="hero-kicker">
                <span className="pulse-dot"/>
                Infectólogo Pediatra · +30 años de trayectoria
              </div>

              <h1 className="hero-title">
                Ciencia y Experiencia{" "}
                <span className="hero-title-accent">al servicio</span>{" "}
                de la salud infantil
              </h1>

              <p className="hero-subtitle">
                El Dr. Carlos Torres Martínez lidera la investigación en vacunología molecular
                e infectología pediátrica en Colombia. Fundador de <strong style={{ color: "rgba(255,255,255,.85)" }}>EcoVaccine</strong> — el sistema
                digital de control de inventario vacunal para consultorios.
              </p>

              <div className="hero-actions">
                <Link href="/vacunas" className="btn btn-emerald">
                  Explorar EcoVaccine
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <Link href="/noticias" className="btn btn-ghost">
                  Ver Publicaciones
                </Link>
              </div>
            </div>

            {/* Photo */}
            <div className="hero-img-wrap animate-right delay-200">
              {/* Credential card top-left */}
              <div className="cred-card cred-card-tl" aria-hidden="true">
                <div className="cred-card-icon" style={{ background: "rgba(0,212,170,.2)" }}>🏆</div>
                <div className="cred-card-text">
                  <span className="cred-card-title">Fellow OPS/OMS</span>
                  <span className="cred-card-sub">Programa EPI · 2015</span>
                </div>
              </div>

              <div className="hero-photo-frame">
                <Image
                  src="/doctor-torres.png"
                  alt="Dr. Carlos Torres Martínez — Infectólogo Pediatra"
                  width={520}
                  height={520}
                  priority
                  fetchPriority="high"
                  style={{ width: "100%", height: "520px", objectFit: "cover", objectPosition: "center top" }}
                />
                <div className="hero-photo-overlay" aria-hidden="true"/>
              </div>

              {/* Credential card bottom-right */}
              <div className="cred-card cred-card-br" aria-hidden="true">
                <div className="cred-card-icon" style={{ background: "rgba(10,77,92,.3)" }}>📚</div>
                <div className="cred-card-text">
                  <span className="cred-card-title">+42 Publicaciones</span>
                  <span className="cred-card-sub">Revistas indexadas ISI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────────────────── */}
      <div className="stats-strip">
        <div className="container">
          <div className="stats-grid">
            {[
              { number: "30+", label: "Años de experiencia clínica" },
              { number: "42", label: "Publicaciones indexadas" },
              { number: "8.000+", label: "Pacientes vacunados/año" },
              { number: "12", label: "Consultorios EcoVaccine" },
            ].map((s, i) => (
              <div className="stat-item" key={i}>
                <div className="stat-number">{s.number}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SOBRE EL DOCTOR ─────────────────────────────────────────── */}
      <section className="section" id="sobre-el-doctor" aria-label="Sobre el Dr. Carlos Torres">
        <div className="container">
          <div className="about-grid">
            {/* Timeline */}
            <div className="animate-left">
              <span className="badge badge-teal mb-4" style={{ display: "inline-flex" }}>
                Trayectoria Académica
              </span>
              <h2 className="section-heading mb-6">
                30 años construyendo<br/>
                <span className="text-teal">evidencia científica</span>
              </h2>
              <div className="timeline">
                {timeline.map((item, i) => (
                  <div className="timeline-item" key={i}>
                    <div className="timeline-line">
                      <div className="timeline-dot"/>
                      <div className="timeline-connector"/>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-year">{item.year}</div>
                      <div className="timeline-title">{item.title}</div>
                      <div className="timeline-sub">{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/sobre-el-doctor" className="btn btn-outline">
                  Ver currículum completo →
                </Link>
              </div>
            </div>

            {/* Research lines */}
            <div className="animate-right delay-200">
              <span className="badge badge-emerald mb-4" style={{ display: "inline-flex" }}>
                Líneas de Investigación
              </span>
              <h2 className="section-heading mb-6">
                Ciencia aplicada a la{" "}
                <span className="text-teal">prevención</span>
              </h2>
              <div className="research-lines">
                {researchLines.map((r, i) => (
                  <div className="research-item" key={i}>
                    <div className="research-icon" aria-hidden="true">{r.icon}</div>
                    <div className="research-text">
                      <h4>{r.title}</h4>
                      <p>{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ÚLTIMAS PUBLICACIONES ────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--slate-100)" }} id="publicaciones" aria-label="Últimas publicaciones">
        <div className="container">
          <div className="text-center mb-8">
            <span className="badge badge-rose mb-4" style={{ display: "inline-flex", margin: "0 auto 16px" }}>
              <span className="pulse-dot"/>
              Publicaciones Recientes
            </span>
            <h2 className="section-heading">Últimas publicaciones<br/>y boletines científicos</h2>
            <p className="section-sub mt-4" style={{ maxWidth: "560px", margin: "16px auto 0" }}>
              Artículos académicos, alertas epidemiológicas y actualizaciones del programa EcoVaccine.
            </p>
          </div>

          <div className="news-grid">
            {mockNews.map((post, i) => (
              <article className="news-card" key={i}>
                <div className="news-card-img" aria-hidden="true" role="img">
                  <span style={{ fontSize: "56px" }}>{post.emoji}</span>
                </div>
                <div className="news-card-body">
                  <div className="news-card-meta">
                    <span className={`badge ${
                      post.category === "Académico" ? "badge-teal" :
                      post.category === "Epidemiología" ? "badge-rose" : "badge-emerald"
                    }`}>{post.category}</span>
                    <span style={{ fontSize: "12px", color: "var(--slate-400)" }}>{post.date}</span>
                  </div>
                  <h3 className="news-card-title">{post.title}</h3>
                  <p className="news-card-excerpt">{post.excerpt}</p>
                  <Link href={`/noticias/${post.slug}`} className="news-card-link">
                    Leer artículo completo
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/noticias" className="btn btn-outline">
              Ver todas las publicaciones
            </Link>
          </div>
        </div>
      </section>

      {/* ── ECOVACCINE ──────────────────────────────────────────────── */}
      <section className="ecovaccine-section" id="ecovaccine" aria-label="EcoVaccine POS">
        <div className="hero-glow-1" aria-hidden="true"/>
        <div className="container relative z-1">
          <div className="text-center mb-8">
            <span className="badge mb-4" style={{
              background: "rgba(0,212,170,.15)", border: "1px solid rgba(0,212,170,.3)",
              color: "var(--emerald-300)", display: "inline-flex", margin: "0 auto 16px"
            }}>
              💉 EcoVaccine POS
            </span>
            <h2 className="section-heading text-white mb-4">
              Control inteligente de<br/>
              <span style={{ color: "var(--emerald-400)" }}>inventario vacunal</span>
            </h2>
            <p className="section-sub" style={{ color: "rgba(255,255,255,.6)", maxWidth: "560px", margin: "0 auto" }}>
              Sistema desarrollado por el Dr. Torres para digitalizar el control de stock de vacunas
              en consultorios. Alertas en tiempo real, trazabilidad de dosis y analítica de consumo.
            </p>
          </div>

          <div className="vaccine-grid">
            {vaccines.map((v, i) => (
              <div className="vaccine-card" key={i}>
                <div className="vaccine-card-icon" aria-hidden="true">{v.icon}</div>
                <div className="vaccine-card-name">{v.name}</div>
                <div className="vaccine-card-lab">{v.lab}</div>
                <span className={`vaccine-card-badge ${v.status === "ok" ? "v-badge-ok" : "v-badge-alert"}`}>
                  {v.status === "ok" ? "✓ En stock" : "⚠ Stock bajo"}
                </span>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/vacunas" className="btn btn-emerald">
              Explorar EcoVaccine
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="cta-section" id="contacto" aria-label="Contacto">
        <div className="container">
          <div className="cta-inner animate-up">
            <span className="badge mb-6" style={{
              background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)",
              color: "white", display: "inline-flex"
            }}>
              Consultas y colaboraciones
            </span>
            <h2 className="cta-title">¿Deseas colaborar o<br/>consultar al Doctor?</h2>
            <p className="cta-sub">
              Para consultas médicas, invitaciones académicas, colaboraciones en investigación
              o información sobre EcoVaccine POS, contáctenos directamente.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a href="mailto:drtorres@ecovaccine.med" className="btn btn-ghost">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/>
                </svg>
                Enviar correo
              </a>
              <a href="https://wa.me/15710000000" target="_blank" rel="noopener noreferrer" className="btn btn-emerald">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
