"use client";
import Link from "next/link";



const mockPosts = [
  {
    slug: "vacunacion-arn-mrna-pediatrica",
    emoji: "🧬",
    category: "Académico",
    date: "15 Jun 2026",
    readTime: "12 min",
    title: "Eficacia y seguridad de las vacunas ARNm en población pediátrica: revisión sistemática 2026",
    excerpt: "Análisis de 42 estudios clínicos publicados entre 2021-2026. Los datos confirman un perfil de seguridad robusto con eficacia ≥ 94% en menores de 5 años frente a cepas circulantes.",
    featured: true,
  },
  {
    slug: "brote-sarampion-colombia",
    emoji: "⚠️",
    category: "Epidemiología",
    date: "10 Jun 2026",
    readTime: "8 min",
    title: "Análisis del brote de sarampión en la región andina: lecciones para la política de salud pública",
    excerpt: "Estudio retrospectivo del brote 2025-2026 revela correlación directa entre hesitación vacunal y mortalidad infantil en zonas rurales de Colombia.",
    featured: false,
  },
  {
    slug: "ecovaccine-control-inventario",
    emoji: "💉",
    category: "EcoVaccine",
    date: "5 Jun 2026",
    readTime: "6 min",
    title: "EcoVaccine POS: Digitalizando el control de inventario vacunal en consultorios de bajo recurso",
    excerpt: "Resultados piloto en 12 consultorios de Bogotá muestran reducción del 67% en pérdida de dosis por vencimiento y desabastecimiento.",
    featured: false,
  },
  {
    slug: "hesitacion-vacunal-estrategias",
    emoji: "💬",
    category: "Prevención",
    date: "1 Jun 2026",
    readTime: "10 min",
    title: "Cómo comunicar la seguridad vacunal a padres reticentes: evidencia y comunicación empática",
    excerpt: "Guía basada en evidencia para profesionales de la salud sobre cómo abordar las dudas de los padres respecto a la vacunación sin generar confrontación.",
    featured: false,
  },
  {
    slug: "neumococo-indigenas",
    emoji: "🔬",
    category: "Académico",
    date: "20 May 2026",
    readTime: "14 min",
    title: "Respuesta inmune ante Neumococo PCV13 en población indígena colombiana: estudio de cohorte",
    excerpt: "Estudio con 320 niños de comunidades indígenas revela diferencias estadísticamente significativas en seroprotección postvacunal respecto a población mestiza.",
    featured: false,
  },
  {
    slug: "rotavirus-prevencion",
    emoji: "🦠",
    category: "Prevención",
    date: "15 May 2026",
    readTime: "7 min",
    title: "Rotavirus en menores de 2 años: impacto de la vacunación universal sobre hospitalizaciones en Colombia",
    excerpt: "Análisis de registros SIVIGILA 2015-2025 demuestra reducción del 78% en hospitalizaciones por diarrea aguda grave desde la introducción de la vacuna en el PAI.",
    featured: false,
  },
];

const categories = ["Todos", "Académico", "Prevención", "Epidemiología", "EcoVaccine"];

export default function NoticiasPage() {
  return (
    <>
      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(160deg, var(--teal-950), var(--teal-900) 60%, var(--slate-900))",
        padding: "80px 0 80px",
        position: "relative",
        overflow: "hidden",
      }} aria-label="Publicaciones y noticias">
        <div className="hero-bg-grid" aria-hidden="true"/>
        <div className="hero-glow-1" aria-hidden="true" style={{ opacity: 0.4 }}/>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="text-center" style={{ maxWidth: "640px", margin: "0 auto" }}>
            <span className="hero-kicker" style={{ display: "inline-flex", margin: "0 auto 20px" }}>
              <span className="pulse-dot"/>
              Publicaciones Científicas
            </span>
            <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: "white", letterSpacing: "-.03em", marginBottom: "16px", fontFamily: "Outfit, sans-serif", lineHeight: 1.1 }}>
              Artículos, alertas<br/>
              <span className="hero-title-accent">y boletines</span>
            </h1>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,.6)", lineHeight: 1.7 }}>
              Investigación académica, alertas epidemiológicas y actualizaciones del sistema
              EcoVaccine publicadas por el Dr. Carlos Torres Martínez.
            </p>
          </div>
        </div>
      </section>

      {/* ── FILTERS ─────────────────────────────────────────────────── */}
      <div style={{ background: "white", borderBottom: "1px solid var(--slate-200)", padding: "16px 0", position: "sticky", top: "72px", zIndex: 50 }}>
        <div className="container">
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "2px" }}>
            {categories.map((cat, i) => (
              <button
                key={i}
                id={`filter-${cat.toLowerCase()}`}
                style={{
                  padding: "8px 18px",
                  borderRadius: "var(--radius-full)",
                  border: i === 0 ? "none" : "1px solid var(--slate-200)",
                  background: i === 0 ? "var(--teal-800)" : "transparent",
                  color: i === 0 ? "white" : "var(--slate-600)",
                  fontWeight: 600, fontSize: "13px", whiteSpace: "nowrap",
                  cursor: "pointer", transition: "all .2s",
                  fontFamily: "inherit",
                }}
              >{cat}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── POSTS GRID ──────────────────────────────────────────────── */}
      <section className="section" aria-label="Lista de publicaciones">
        <div className="container">
          {/* Featured */}
          {mockPosts.filter(p => p.featured).map((post, i) => (
            <Link key={i} href={`/noticias/${post.slug}`} style={{ textDecoration: "none" }}>
              <article style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                background: "white", border: "1px solid var(--slate-200)",
                borderRadius: "var(--radius-xl)", overflow: "hidden",
                marginBottom: "32px", transition: "box-shadow .25s, border-color .25s",
                cursor: "pointer",
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-lg)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(10,77,92,.3)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--slate-200)";
                }}
              >
                <div style={{
                  background: "linear-gradient(135deg, var(--teal-900), var(--teal-800))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "80px", padding: "48px",
                }} aria-hidden="true">{post.emoji}</div>
                <div style={{ padding: "40px" }}>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center" }}>
                    <span className={`badge ${post.category === "Académico" ? "badge-teal" : "badge-emerald"}`}>
                      ⭐ Artículo Destacado
                    </span>
                    <span className="badge badge-teal">{post.category}</span>
                  </div>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--slate-900)", marginBottom: "12px", fontFamily: "Outfit, sans-serif", lineHeight: 1.3 }}>
                    {post.title}
                  </h2>
                  <p style={{ fontSize: "14px", color: "var(--slate-500)", lineHeight: 1.7, marginBottom: "20px" }}>
                    {post.excerpt}
                  </p>
                  <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--slate-400)" }}>
                    <span>📅 {post.date}</span>
                    <span>⏱ {post.readTime} de lectura</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}

          {/* Grid */}
          <div className="news-grid">
            {mockPosts.filter(p => !p.featured).map((post, i) => (
              <article className="news-card" key={i}>
                <div className="news-card-img" role="img" aria-hidden="true">
                  <span style={{ fontSize: "56px" }}>{post.emoji}</span>
                </div>
                <div className="news-card-body">
                  <div className="news-card-meta">
                    <span className={`badge ${
                      post.category === "Académico" ? "badge-teal" :
                      post.category === "Epidemiología" ? "badge-rose" :
                      post.category === "EcoVaccine" ? "badge-emerald" : "badge-teal"
                    }`}>{post.category}</span>
                    <span style={{ fontSize: "11px", color: "var(--slate-400)" }}>{post.readTime}</span>
                  </div>
                  <h3 className="news-card-title">{post.title}</h3>
                  <p className="news-card-excerpt">{post.excerpt}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", color: "var(--slate-400)" }}>{post.date}</span>
                    <Link href={`/noticias/${post.slug}`} className="news-card-link">
                      Leer
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
