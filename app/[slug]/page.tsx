import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TenantHomePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Load tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, nombre")
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (!tenant) notFound();

  // Load all portal data in parallel
  const [configRes, lineasRes, hitosRes, noticiasRes, alertasRes] = await Promise.all([
    supabase.from("configuracion_portal").select("*").eq("tenant_id", tenant.id).single(),
    supabase.from("lineas_investigacion").select("*").eq("tenant_id", tenant.id).eq("activo", true).order("orden"),
    supabase.from("hitos_timeline").select("*").eq("tenant_id", tenant.id).order("orden"),
    supabase.from("noticias_posts").select("id,titulo,resumen,emoji,categoria,created_at,slug").eq("tenant_id", tenant.id).eq("publicado", true).order("created_at", { ascending: false }).limit(3),
    supabase.from("alertas_epidemiologicas").select("*").eq("tenant_id", tenant.id).eq("activa", true).order("created_at", { ascending: false }).limit(1),
  ]);

  const config = configRes.data;
  const lineas = lineasRes.data ?? [];
  const hitos = hitosRes.data ?? [];
  const noticias = noticiasRes.data ?? [];
  const alerta = alertasRes.data?.[0] ?? null;

  const primaryColor = config?.color_primario || "#0A4D5C";
  const accentColor = config?.color_acento || "#00D4AA";

  return (
    <>
      {/* ── ALERTA EPIDEMIOLÓGICA ────────────────────────────── */}
      {alerta && (
        <div style={{
          background: alerta.nivel === "critical" ? "rgba(244,63,94,.12)" : alerta.nivel === "warning" ? "rgba(245,158,11,.12)" : "rgba(0,212,170,.12)",
          borderBottom: `1px solid ${alerta.nivel === "critical" ? "rgba(244,63,94,.3)" : alerta.nivel === "warning" ? "rgba(245,158,11,.3)" : "rgba(0,212,170,.3)"}`,
          padding: "12px 0",
        }}>
          <div className="container" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "18px" }}>{alerta.nivel === "critical" ? "🔴" : alerta.nivel === "warning" ? "🟠" : "🔵"}</span>
            <div>
              <strong style={{ fontSize: "14px" }}>{alerta.titulo}</strong>
              {alerta.descripcion && <span style={{ fontSize: "13px", marginLeft: "8px", opacity: 0.75 }}>{alerta.descripcion}</span>}
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(160deg, ${primaryColor}f0, ${primaryColor}cc 60%, var(--slate-900))`,
        padding: "80px 0 100px",
        position: "relative",
        overflow: "hidden",
      }} aria-label="Presentación del doctor">
        <div className="hero-bg-grid" aria-hidden="true" />
        <div className="hero-glow-1" aria-hidden="true" />

        <div className="container">
          {config?.hero_badge_texto && (
            <div className="hero-kicker animate-up" style={{ display: "inline-flex", marginBottom: "24px" }}>
              <span className="pulse-dot" />
              {config.hero_badge_texto}
            </div>
          )}

          <div className="hero-grid">
            <div className="hero-content animate-left">
              <h1 className="hero-title" style={{ marginBottom: "20px" }}>
                {config?.hero_titulo || config?.nombre_doctor || tenant.nombre}
                {config?.hero_subtitulo && (
                  <><br /><span className="hero-title-accent">{config.hero_subtitulo}</span></>
                )}
              </h1>

              {config?.bio_corta && (
                <p style={{ fontSize: "18px", color: "rgba(255,255,255,.7)", lineHeight: 1.7, marginBottom: "32px", maxWidth: "560px" }}>
                  {config.bio_corta}
                </p>
              )}

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Link href={`/${slug}/sobre-el-doctor`} className="btn btn-emerald">
                  Conocer al Doctor
                </Link>
                <Link href={`/${slug}/vacunas`} className="btn btn-ghost">
                  EcoVaccine →
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="hero-stats animate-right delay-300">
              {[
                { value: config?.stat_anos_experiencia || "30+", label: "Años de experiencia" },
                { value: config?.stat_publicaciones || "50+", label: "Publicaciones científicas" },
                { value: config?.stat_pacientes_anio || "2,000+", label: "Pacientes al año" },
                { value: config?.stat_consultorios || "3", label: "Consultorios" },
              ].map((stat, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-number">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LÍNEAS DE INVESTIGACIÓN ─────────────────────────── */}
      {lineas.length > 0 && (
        <section className="section" aria-label="Líneas de investigación">
          <div className="container">
            <div className="text-center mb-8">
              <span className="badge badge-teal mb-4" style={{ display: "inline-flex" }}>Áreas de especialidad</span>
              <h2 className="section-heading">Líneas de<br /><span className="text-teal">investigación activa</span></h2>
            </div>
            <div className="features-grid">
              {lineas.map((linea) => (
                <div key={linea.id} className="feature-card">
                  <div className="feature-icon">{linea.icono}</div>
                  <h3 className="feature-title">{linea.titulo}</h3>
                  <p className="feature-desc">{linea.descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TIMELINE ─────────────────────────────────────────── */}
      {hitos.length > 0 && (
        <section className="section" style={{ background: "var(--slate-50)" }} aria-label="Trayectoria académica">
          <div className="container">
            <div className="text-center mb-8">
              <span className="badge badge-emerald mb-4" style={{ display: "inline-flex" }}>Trayectoria</span>
              <h2 className="section-heading">Formación y<br /><span className="text-teal">hitos académicos</span></h2>
            </div>
            <div className="timeline">
              {hitos.map((hito) => (
                <div key={hito.id} className="timeline-item">
                  <div className="timeline-year">{hito.anio}</div>
                  <div className="timeline-dot" aria-hidden="true" />
                  <div className="timeline-content">
                    <h3 className="timeline-title">{hito.titulo}</h3>
                    {hito.institucion && <p className="timeline-sub">{hito.institucion}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── NOTICIAS RECIENTES ───────────────────────────────── */}
      {noticias.length > 0 && (
        <section className="section" aria-label="Publicaciones recientes">
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <span className="badge badge-teal mb-4" style={{ display: "inline-flex" }}>Publicaciones</span>
                <h2 className="section-heading">Noticias y<br /><span className="text-teal">artículos recientes</span></h2>
              </div>
              <Link href={`/${slug}/noticias`} className="btn btn-outline">Ver todas →</Link>
            </div>
            <div className="news-grid">
              {noticias.map((post) => (
                <article key={post.id} className="news-card">
                  <div className="news-card-img" role="img" aria-hidden="true">
                    <span style={{ fontSize: "52px" }}>{post.emoji || "📄"}</span>
                  </div>
                  <div className="news-card-body">
                    <div className="news-card-meta">
                      <span className={`badge ${post.categoria === "Académico" ? "badge-teal" : post.categoria === "Epidemiología" ? "badge-rose" : "badge-emerald"}`}>
                        {post.categoria}
                      </span>
                    </div>
                    <h3 className="news-card-title">{post.titulo}</h3>
                    <p className="news-card-excerpt">{post.resumen}</p>
                    <Link href={`/${slug}/noticias/${post.slug}`} className="news-card-link">
                      Leer
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA CONTACTO ─────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, ${primaryColor}, ${accentColor}88)`,
        padding: "80px 0", textAlign: "center", position: "relative", overflow: "hidden",
      }} aria-label="Contactar al doctor">
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,.1) 0%, transparent 60%)" }} />
        <div className="container" style={{ position: "relative", zIndex: 1, maxWidth: "560px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: "white", marginBottom: "16px", fontFamily: "Outfit, sans-serif" }}>
            ¿Necesita una consulta?
          </h2>
          <p style={{ color: "rgba(255,255,255,.8)", fontSize: "16px", lineHeight: 1.7, marginBottom: "32px" }}>
            {config?.nombre_doctor || "El doctor"} atiende consultas de infectología pediátrica y vacunación. Agenda tu cita hoy.
          </p>
          {config?.email && (
            <a href={`mailto:${config.email}`} className="btn" style={{
              background: "white", color: primaryColor, fontWeight: 800,
              padding: "16px 36px", fontSize: "16px",
            }}>
              Contactar ahora →
            </a>
          )}
        </div>
      </section>
    </>
  );
}
