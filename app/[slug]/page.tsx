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
  const [configRes, lineasRes, hitosRes, noticiasRes] = await Promise.all([
    supabase.from("configuracion_portal").select("*").eq("tenant_id", tenant.id).single(),
    supabase.from("lineas_investigacion").select("*").eq("tenant_id", tenant.id).eq("activo", true).order("orden"),
    supabase.from("hitos_timeline").select("*").eq("tenant_id", tenant.id).order("orden"),
    supabase.from("noticias_posts").select("id,titulo,resumen,emoji,categoria,created_at,slug,imagen_portada_url").eq("tenant_id", tenant.id).eq("publicado", true).order("created_at", { ascending: false }).limit(6),
  ]);

  const config = configRes.data;
  const lineas = lineasRes.data ?? [];
  const hitos = hitosRes.data ?? [];
  const noticias = noticiasRes.data ?? [];

  const primaryColor = config?.color_primario || "#0A4D5C";
  const accentColor = config?.color_acento || "#00D4AA";

  const renderTitle = (title: string) => {
    const target = "al servicio";
    if (title.includes(target)) {
      const parts = title.split(target);
      return (
        <>
          {parts[0]}
          <span className="hero-title-accent" style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            {target}
          </span>
          {parts[1]}
        </>
      );
    }
    return title;
  };

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero" id="inicio" style={{
        background: `linear-gradient(160deg, ${primaryColor}f0, ${primaryColor}cc 60%, var(--slate-900))`,
        padding: "80px 0 100px",
        minHeight: "calc(100vh - var(--nav-h))",
        display: "flex",
        alignItems: "center",
      }} aria-label="Presentación del doctor">
        <div className="hero-bg-grid" aria-hidden="true" />
        <div className="hero-glow-1" aria-hidden="true" />
        <div className="hero-glow-2" aria-hidden="true" />

        <div className="container">
          <div className="hero-inner">
            <div className="hero-content animate-left">
              {config?.hero_badge_texto && (
                <div className="hero-kicker" style={{
                  background: "rgba(0, 212, 170, 0.08)",
                  border: "1px solid rgba(0, 212, 170, 0.2)",
                  borderRadius: "30px",
                  padding: "6px 16px",
                  color: "#00d4aa",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "24px"
                }}>
                  <span style={{ width: "6px", height: "6px", background: "#00d4aa", borderRadius: "50%" }} />
                  {config.hero_badge_texto}
                </div>
              )}
              <h1 className="hero-title" style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(38px, 5vw, 64px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.03em", color: "#ffffff", marginBottom: "24px" }}>
                {renderTitle(config?.hero_titulo || config?.nombre_doctor || tenant.nombre)}
              </h1>

              {config?.bio_corta && (
                <p className="hero-subtitle" style={{ fontSize: "17px", color: "rgba(255,255,255,.65)", lineHeight: 1.7, marginBottom: "36px", fontWeight: 400, maxWidth: "480px" }}>
                  {config.bio_corta}
                </p>
              )}

              <div className="hero-actions" style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "40px" }}>
                <Link href={`/${slug}/vacunas`} className="btn" style={{
                  padding: "14px 28px",
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
                  borderRadius: "12px",
                  color: "#0c111d",
                  fontSize: "15px",
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: `0 4px 12px ${accentColor}26`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  Explorar EcoVaccine
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <Link href={`/${slug}/noticias`} className="btn" style={{
                  padding: "14px 28px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 700,
                  textDecoration: "none"
                }}>
                  Ver Publicaciones
                </Link>
              </div>
            </div>

            <div className="hero-img-wrap animate-right delay-200">
              <div className="hero-photo-frame" style={{ borderRadius: "24px" }}>
                <Image
                  src={config?.foto_url || "/doctor-torres.png"}
                  alt={config?.nombre_doctor || "Dr. Carlos Torres"}
                  width={600}
                  height={520}
                  priority
                  style={{ objectFit: "cover", objectPosition: "center top", borderRadius: "24px" }}
                />
                <div className="hero-photo-overlay" />
              </div>

              {/* Floating cards */}
              <div className="cred-card cred-card-tl" style={{ padding: "12px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", borderRadius: "16px" }}>
                <div className="cred-card-icon" style={{ background: `${accentColor}22`, color: accentColor }}>👨‍⚕️</div>
                <div className="cred-card-text">
                  <div className="cred-card-title">{config?.titulo_doctor || "Pediatra Infectólogo"}</div>
                  <div className="cred-card-sub" style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "10px" }}>{config?.especialidad || "Miembro de la SCP y SLIPE"}</div>
                </div>
              </div>
              <div className="cred-card cred-card-br" style={{ padding: "12px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", borderRadius: "16px" }}>
                <div className="cred-card-icon" style={{ background: `${accentColor}22`, color: accentColor }}>🏆</div>
                <div className="cred-card-text">
                  <div className="cred-card-title">{config?.stat_publicaciones ? `${config.stat_publicaciones} Publicaciones` : "+42 Publicaciones"}</div>
                  <div className="cred-card-sub" style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "10px" }}>Revistas indexadas ISI</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ROW ─────────────────────────────────────────── */}
      <section className="stats-strip">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number" style={{ color: primaryColor }}>{config?.stat_anos_experiencia || "30+"}</div>
              <div className="stat-label">Años de experiencia</div>
            </div>
            <div className="stat-item">
              <div className="stat-number" style={{ color: primaryColor }}>{config?.stat_publicaciones || "50+"}</div>
              <div className="stat-label">Publicaciones científicas</div>
            </div>
            <div className="stat-item">
              <div className="stat-number" style={{ color: primaryColor }}>{config?.stat_pacientes_anio || "2,000+"}</div>
              <div className="stat-label">Pacientes al año</div>
            </div>
            <div className="stat-item">
              <div className="stat-number" style={{ color: primaryColor }}>{config?.stat_consultorios || "3"}</div>
              <div className="stat-label">Consultorios</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN COMBINADA: TRAYECTORIA Y LÍNEAS DE INVESTIGACIÓN ── */}
      {(hitos.length > 0 || lineas.length > 0) && (
        <section className="section" id="trayectoria" style={{ background: "var(--white)", padding: "100px 0" }}>
          <div className="container">
            <div className="about-grid">
              
              {/* Columna Izquierda: Trayectoria / Timeline */}
              <div>
                <h2 className="section-heading" style={{ fontFamily: "Outfit, sans-serif", fontSize: "32px", fontWeight: 800, lineHeight: 1.15, color: "var(--slate-900)", marginBottom: "36px" }}>
                  30 años construyendo<br/>
                  <span style={{ color: primaryColor }}>evidencia científica</span>
                </h2>
                {hitos.length > 0 && (
                  <div className="timeline">
                    {hitos.map((hito) => (
                      <div key={hito.id} className="timeline-item" style={{ paddingBottom: "24px" }}>
                        <div className="timeline-line">
                          <div className="timeline-dot" style={{ background: primaryColor, border: "3px solid var(--white)", boxShadow: `0 0 0 3px ${primaryColor}22` }} />
                          <div className="timeline-connector" />
                        </div>
                        <div className="timeline-content" style={{ paddingLeft: "12px" }}>
                          <div className="timeline-year" style={{ color: primaryColor, fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em" }}>{hito.anio}</div>
                          <h3 className="timeline-title" style={{ fontSize: "14px", fontWeight: 700, margin: "2px 0" }}>{hito.titulo}</h3>
                          {hito.institucion && <p className="timeline-sub" style={{ fontSize: "12px", color: "var(--slate-500)" }}>{hito.institucion}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: "32px" }}>
                  <Link href={`/${slug}/sobre-el-doctor`} className="btn btn-outline" style={{ display: "inline-flex", borderColor: primaryColor, color: primaryColor, borderRadius: "var(--radius-full)", padding: "12px 24px", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}>
                    Ver currículum completo →
                  </Link>
                </div>
              </div>

              {/* Columna Derecha: Líneas de Investigación */}
              <div>
                <span className="badge badge-teal" style={{ background: `${accentColor}15`, color: primaryColor, display: "inline-flex", marginBottom: "16px" }}>
                  LÍNEAS DE INVESTIGACIÓN
                </span>
                <h2 className="section-heading" style={{ fontFamily: "Outfit, sans-serif", fontSize: "32px", fontWeight: 800, lineHeight: 1.15, color: "var(--slate-900)", marginBottom: "36px" }}>
                  Ciencia aplicada a la<br/>
                  <span style={{ color: primaryColor }}>prevención</span>
                </h2>
                {lineas.length > 0 && (
                  <div className="research-lines" style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "32px" }}>
                    {lineas.map((linea) => (
                      <div key={linea.id} className="research-item">
                        <div className="research-icon" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}>
                          {linea.icono}
                        </div>
                        <div className="research-text">
                          <h4 style={{ color: "var(--slate-900)", fontWeight: 700, margin: "0 0 4px 0" }}>{linea.titulo}</h4>
                          <p style={{ color: "var(--slate-500)", margin: 0 }}>{linea.descripcion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ── NOTICIAS RECIENTES (CARRUSEL) ────────────────────── */}
      {noticias.length > 0 && (
        <section className="section" style={{ background: "var(--slate-50)" }} aria-label="Publicaciones recientes">
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <h2 className="section-heading" style={{ fontSize: "36px", fontWeight: 800, fontFamily: "Outfit, sans-serif", color: "var(--slate-900)" }}>
                Noticias y<br />
                <span style={{ color: primaryColor }}>boletines científicos</span>
              </h2>
              <p style={{ fontSize: "15px", color: "var(--slate-500)", marginTop: "12px", maxWidth: "600px", margin: "12px auto 0" }}>
                Artículos académicos, alertas epidemiológicas y actualizaciones del programa EcoVaccine.
              </p>
            </div>
            
            <div 
              className="news-carousel-scroller" 
              style={{
                display: "flex",
                gap: "24px",
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                padding: "16px 4px 32px 4px",
                scrollbarWidth: "none",
                msOverflowStyle: "none"
              }}
            >
              {noticias.map((post) => (
                <article key={post.id} className="news-card" style={{ flex: "0 0 360px", scrollSnapAlign: "start" }}>
                  <div className="news-card-img" style={{ height: "200px", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}08)` }}>
                    {post.imagen_portada_url ? (
                      <img src={post.imagen_portada_url} alt={post.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "56px" }}>{post.emoji || "📄"}</span>
                    )}
                  </div>
                  <div className="news-card-body">
                    <div className="news-card-meta">
                      <span className={`badge ${post.categoria === "Académico" ? "badge-teal" : post.categoria === "Epidemiología" ? "badge-rose" : "badge-emerald"}`}>
                        {post.categoria}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--slate-400)", fontWeight: 600 }}>
                        {new Date(post.created_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                    <h3 className="news-card-title" style={{ fontSize: "16px", minHeight: "44px" }}>{post.titulo}</h3>
                    <p className="news-card-excerpt" style={{ fontSize: "13px", height: "64px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                      {post.resumen}
                    </p>
                    <Link href={`/${slug}/noticias/${post.slug}`} className="news-card-link" style={{ color: primaryColor }}>
                      Leer artículo completo →
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: "32px" }}>
              <Link href={`/${slug}/noticias`} className="btn btn-outline" style={{ borderRadius: "var(--radius-full)", padding: "12px 32px", fontSize: "14px", fontWeight: 700, borderColor: primaryColor, color: primaryColor }}>
                Ver todas las publicaciones
              </Link>
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
