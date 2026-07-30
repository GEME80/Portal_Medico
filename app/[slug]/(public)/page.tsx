import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import ScrollObserver from "@/components/ScrollObserver";
import { notFound } from "next/navigation";
import TextReveal from "@/components/TextReveal";
import CanvasParticles from "@/components/CanvasParticles";
import { Activity, Syringe, BarChart3, Shield, FlaskConical, Dna, FileText } from "lucide-react";
import NewsCarousel from "@/components/NewsCarousel";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const renderModernIcon = (emoji: string = "") => {
  const clean = emoji.trim();
  if (clean.includes("🦠") || clean.toLowerCase().includes("virus") || clean.toLowerCase().includes("bacteria")) {
    return <Activity size={20} />;
  }
  if (clean.includes("💉") || clean.toLowerCase().includes("vacuna") || clean.toLowerCase().includes("syringe")) {
    return <Syringe size={20} />;
  }
  if (clean.includes("📊") || clean.toLowerCase().includes("grafica") || clean.toLowerCase().includes("chart")) {
    return <BarChart3 size={20} />;
  }
  if (clean.includes("📚") || clean.toLowerCase().includes("investigacion") || clean.toLowerCase().includes("book") || clean.toLowerCase().includes("pdf")) {
    return <FileText size={20} />;
  }
  if (clean.includes("🧬")) {
    return <Dna size={20} />;
  }
  if (clean.includes("🔬")) {
    return <FlaskConical size={20} />;
  }
  return <Shield size={20} />;
};

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

  const primaryColor = config?.color_primario || "#0c111d";
  const accentColor = config?.color_acento || "#00D4AA";

  const defaultHeroData = {
    badge: "Infectólogo · +30 años de experiencia",
    g1_t: "15K+",
    g1_s: "Pacientes",
    g2_t: "100%",
    g2_s: "Seguro",
    hero_btn_prim: "Explorar HubMed",
    hero_btn_sec: "Ver Publicaciones",
    tray_badge: "TRAYECTORIA E INVESTIGACIÓN",
    tray_title_1: "Décadas construyendo",
    tray_title_2: "evidencia científica",
    inv_title_1: "Ciencia aplicada a la",
    inv_title_2: "prevención",
    servicios_titulo: "Programa Integral de Vacunación",
    servicios_desc: "Protección inteligente y seguimiento continuo de esquemas de vacunación.",
    servicios_c1_title: "Seguridad Total",
    servicios_c1_text: "Aplicamos los esquemas más actualizados para proteger a quienes más quiere.",
    servicios_c2_title: "Cuidado Familiar",
    servicios_c2_text: "Atención cálida y humana centrada en el bienestar integral de su familia.",
    servicios_c3_title: "Evidencia Científica",
    servicios_c3_text: "Decisiones respaldadas por publicaciones académicas y consensos globales.",
    cta_titulo: "¿Necesita una consulta?",
    cta_desc: "El doctor atiende consultas presenciales y virtuales previa programación.",
    cta_btn_text: "Contactar ahora →",
    cta_mostrar: true
  };

  let heroData: any = { ...defaultHeroData };
  if (config?.hero_badge_texto) {
    if (config.hero_badge_texto.startsWith("{")) {
      try {
        const parsed = JSON.parse(config.hero_badge_texto);
        heroData = { ...heroData, ...parsed };
      } catch (e) {}
    } else {
      heroData.badge = config.hero_badge_texto;
    }
  }

  return (
    <>
      <ScrollObserver />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero" id="inicio" style={{
        background: "var(--white)",
        padding: "60px 0 10px",
        display: "flex",
        alignItems: "center",
      }} aria-label="Presentación del doctor">
        <div className="container">
          <div className="hero-inner">
            <div className="hero-content">
              {heroData.badge && (
                <div className="hero-kicker" style={{
                  background: "rgba(0, 0, 0, 0.04)",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  borderRadius: "0px",
                  padding: "6px 16px",
                  color: "#000000",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: "24px"
                }}>
                  <span style={{ width: "6px", height: "6px", background: accentColor, borderRadius: "50%" }} />
                  {heroData.badge}
                </div>
              )}
              <h1 className="hero-title" style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(38px, 5.5vw, 68px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em", color: "#000000", marginBottom: "24px" }}>
                <TextReveal text={config?.hero_titulo || config?.nombre_doctor || tenant.nombre} />
              </h1>

              {config?.bio_corta && (
                <p className="hero-subtitle" style={{ fontSize: "18px", color: "var(--slate-600)", lineHeight: 1.7, marginBottom: "36px", fontWeight: 400, maxWidth: "520px" }}>
                  {config.bio_corta}
                </p>
              )}

              <div className="hero-actions" style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "40px" }}>
                <Link href={`/${slug}/vacunas`} className="btn btn-primary" style={{
                  padding: "14px 28px",
                  borderRadius: "0px",
                  fontSize: "15px",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "none"
                }}>
                  {heroData.hero_btn_prim}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <Link href={`/${slug}/noticias`} className="btn btn-outline" style={{
                  padding: "14px 28px",
                  borderRadius: "0px",
                  fontSize: "15px",
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "none"
                }}>
                  {heroData.hero_btn_sec}
                </Link>
              </div>
            </div>

            <div className="hero-img-wrap">
              <div className="hero-photo-frame" style={{ borderRadius: "20px" }}>
                <Image
                  src={config?.foto_url || "/doctor-torres.png"}
                  alt={config?.nombre_doctor || "Dr. Carlos Torres"}
                  width={600}
                  height={520}
                  priority
                  style={{ objectFit: "cover", objectPosition: "center top", borderRadius: "20px" }}
                />
              </div>

              {/* Floating credentials */}
              {(heroData.g1_t || config?.titulo_doctor) && (
                <div className="cred-card cred-card-tl" style={{ padding: "12px 16px", borderRadius: "0px" }}>
                  <div className="cred-card-icon" style={{ background: "rgba(0, 0, 0, 0.05)", color: "#000000" }}>👨‍⚕️</div>
                  <div className="cred-card-text">
                    <div className="cred-card-title">{heroData.g1_t || config?.titulo_doctor}</div>
                    <div className="cred-card-sub" style={{ color: "rgba(0, 0, 0, 0.5)", fontSize: "10px" }}>{heroData.g1_s || config?.especialidad}</div>
                  </div>
                </div>
              )}
              
              {(heroData.g2_t || config?.stat_publicaciones) && (
                <div className="cred-card cred-card-br" style={{ padding: "12px 16px", borderRadius: "0px" }}>
                  <div className="cred-card-icon" style={{ background: "rgba(0, 0, 0, 0.05)", color: "#000000" }}>🏆</div>
                  <div className="cred-card-text">
                    <div className="cred-card-title">{heroData.g2_t || `${config?.stat_publicaciones} Publicaciones`}</div>
                    <div className="cred-card-sub" style={{ color: "rgba(0, 0, 0, 0.5)", fontSize: "10px" }}>{heroData.g2_s || "Revistas indexadas ISI"}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ROW ─────────────────────────────────────────── */}
      <section className="stats-strip">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{config?.stat_anos_experiencia || "30+"}</div>
              <div className="stat-label">Años de experiencia</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{config?.stat_publicaciones || "50+"}</div>
              <div className="stat-label">Publicaciones científicas</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{config?.stat_pacientes_anio || "2,000+"}</div>
              <div className="stat-label">Pacientes al año</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{config?.stat_consultorios || "3"}</div>
              <div className="stat-label">Consultorios</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN COMBINADA: TRAYECTORIA Y LÍNEAS DE INVESTIGACIÓN ── */}
      {(hitos.length > 0 || lineas.length > 0) && (
        <section className="section" id="trayectoria" style={{ background: "var(--white)", padding: "120px 0", position: "relative", overflow: "hidden" }}>
          {/* Canvas particles background */}
          <CanvasParticles />

          <div className="container" style={{ position: "relative", zIndex: 1 }}>
            <div style={{ marginBottom: "40px" }}>
              <span className="badge" style={{
                background: "#000000",
                color: "#ffffff",
                border: "none",
                borderRadius: "0px",
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.15em",
                display: "inline-flex"
              }}>
                {heroData.tray_badge}
              </span>
            </div>
            <div className="about-grid">
              
              {/* Columna Izquierda: Trayectoria / Timeline */}
              <div>
                <h2 className="section-heading" style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, lineHeight: 1.15, color: "#000000", marginBottom: "36px" }}>
                  {heroData.tray_title_1}<br/>
                  <span style={{ color: accentColor }}>{heroData.tray_title_2}</span>
                </h2>
                {hitos.length > 0 && (
                  <div className="clinical-timeline">
                    {hitos.map((hito) => (
                      <div key={hito.id} className="clinical-timeline-item">
                        <div className="clinical-year">{hito.anio}</div>
                        <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "2px 0", color: "#000000" }}>{hito.titulo}</h3>
                        {hito.institucion && <p style={{ fontSize: "14px", color: "var(--slate-500)", margin: 0 }}>{hito.institucion}</p>}
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Columna Derecha: Líneas de Investigación */}
              <div>
                <h2 className="section-heading" style={{ fontFamily: "Outfit, sans-serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, lineHeight: 1.15, color: "#000000", marginBottom: "36px" }}>
                  {heroData.inv_title_1}<br/>
                  <span style={{ color: accentColor }}>{heroData.inv_title_2}</span>
                </h2>
                {lineas.length > 0 && (
                  <div className="research-lines" style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "32px" }}>
                    {lineas.map((linea) => (
                      <div key={linea.id} className="research-item">
                        <div className="research-icon">
                          {renderModernIcon(linea.icono)}
                        </div>
                        <div className="research-text">
                          <h4 style={{ color: "#000000", fontWeight: 700, margin: "0 0 4px 0" }}>{linea.titulo}</h4>
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

      {/* ── HUBMED PROGRAMA DE CUIDADO ────────────────────── */}
      <section className="section" style={{ background: "var(--white)", borderTop: "1px solid var(--slate-100)", borderBottom: "1px solid var(--slate-100)", padding: "120px 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <h2 className="section-heading" style={{ color: "#000000", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900 }}>
              {(() => {
                const title = heroData.servicios_titulo;
                const highlightWords = ["HubMed", "Vacunación", "Vacunacion", "vacunación", "vacunacion"];
                let foundWord = "";
                for (const word of highlightWords) {
                  if (title.includes(word)) {
                    foundWord = word;
                    break;
                  }
                }
                if (foundWord) {
                  const parts = title.split(foundWord);
                  return (
                    <>
                      {parts[0]}
                      <span style={{ color: accentColor }}>{foundWord}</span>
                      {parts[1]}
                    </>
                  );
                }
                return title;
              })()}
            </h2>
            <p style={{ color: "var(--slate-500)", fontSize: "17px", maxWidth: "600px", margin: "16px auto 0", lineHeight: 1.7 }}>
              {heroData.servicios_desc}
            </p>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px" }}>
            <div className="soft-card">
              <div className="soft-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#000000", marginBottom: "12px", fontFamily: "Outfit, sans-serif" }}>{heroData.servicios_c1_title}</h3>
              <p style={{ color: "var(--slate-600)", fontSize: "15px", margin: 0, lineHeight: 1.6 }}>{heroData.servicios_c1_text}</p>
            </div>
            
            <div className="soft-card">
              <div className="soft-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#000000", marginBottom: "12px", fontFamily: "Outfit, sans-serif" }}>{heroData.servicios_c2_title}</h3>
              <p style={{ color: "var(--slate-600)", fontSize: "15px", margin: 0, lineHeight: 1.6 }}>{heroData.servicios_c2_text}</p>
            </div>
            
            <div className="soft-card">
              <div className="soft-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#000000", marginBottom: "12px", fontFamily: "Outfit, sans-serif" }}>{heroData.servicios_c3_title}</h3>
              <p style={{ color: "var(--slate-600)", fontSize: "15px", margin: 0, lineHeight: 1.6 }}>{heroData.servicios_c3_text}</p>
            </div>
          </div>
          

        </div>
      </section>

      {/* ── NOTICIAS RECIENTES ────────────────────────────────── */}
      {noticias.length > 0 && (
        <section className="section" style={{ background: "var(--white)", padding: "120px 0" }} aria-label="Publicaciones recientes">
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <h2 className="section-heading" style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, fontFamily: "Outfit, sans-serif", color: "#000000" }}>
                Noticias y<br />
                <span style={{ color: accentColor }}>boletines científicos</span>
              </h2>
              <p style={{ fontSize: "15px", color: "var(--slate-500)", marginTop: "12px", maxWidth: "600px", margin: "12px auto 0", lineHeight: 1.6 }}>
                Artículos académicos, alertas epidemiológicas y actualizaciones del programa HubMed.
              </p>
            </div>
            
            <NewsCarousel noticias={noticias} slug={slug} accentColor={accentColor} />
            

          </div>
        </section>
      )}


    </>
  );
}
